#!/usr/bin/env python3
"""
update-wp-narrative.py - Update narrative sections in Work Package progress files
Purpose: Move task narrative blocks between sections based on status changes
Usage: python3 update-wp-narrative.py <wp_file> <task_id> <status_emoji> <progress>
"""

import sys
import re
from pathlib import Path

def find_section_boundaries(lines):
    """Find line numbers for section headers"""
    sections = {}
    for i, line in enumerate(lines):
        if line.startswith("## Completed Work Details"):
            sections["Completed Work Details"] = i
        elif line.startswith("## In Progress Work Details"):
            sections["In Progress Work Details"] = i
        elif line.startswith("## Planned Work Details"):
            sections["Planned Work Details"] = i
    return sections

def create_missing_section(lines, section_name, insert_after_section):
    """Create a missing section by inserting it after another section"""
    # Find the insert_after_section
    insert_pos = None
    for i, line in enumerate(lines):
        if line.startswith(f"## {insert_after_section}"):
            insert_pos = i
            # Find end of this section (next ## header or end of file)
            for j in range(i + 1, len(lines)):
                if lines[j].startswith("##"):
                    insert_pos = j
                    break
            else:
                insert_pos = len(lines)
            break

    if insert_pos is not None:
        # Insert new section header with blank lines
        lines.insert(insert_pos, "\n")
        lines.insert(insert_pos + 1, f"## {section_name}\n")
        lines.insert(insert_pos + 2, "\n")
        print(f"ℹ️  Created missing section: {section_name}", file=sys.stderr)
        return True
    else:
        print(f"⚠️  Could not create section {section_name} (insert point not found)", file=sys.stderr)
        return False

def find_task_block(lines, task_id):
    """Find start and end line numbers for task narrative block"""
    start = None
    end = None

    for i, line in enumerate(lines):
        # Find start: ### T-XX:
        if re.match(rf"^### {task_id}:", line):
            start = i
        # Find end: next ### or ## (but not same line)
        elif start is not None and i > start and (line.startswith("###") or line.startswith("##")):
            end = i
            break

    # If no end found, task goes to end of file
    if start is not None and end is None:
        end = len(lines)

    return start, end

def find_current_section(lines, task_start, sections):
    """Determine which section contains the task"""
    # Find the closest section header before task_start
    closest_section = None
    closest_distance = float('inf')

    for section_name, section_line in sections.items():
        if section_line < task_start:
            distance = task_start - section_line
            if distance < closest_distance:
                closest_distance = distance
                closest_section = section_name

    return closest_section

def update_wp_narrative(wp_file, task_id, status_emoji, progress):
    """Update task narrative section based on status"""

    # Read file
    with open(wp_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Map status to section
    status_to_section = {
        "✅ Complete": "Completed Work Details",
        "🟡 In Progress": "In Progress Work Details",
        "🔴 Not Started": "Planned Work Details"
    }

    target_section = status_to_section.get(status_emoji)
    if not target_section:
        print(f"⚠️  Unknown status: {status_emoji}", file=sys.stderr)
        return False

    # Find sections
    sections = find_section_boundaries(lines)

    # Create missing sections if needed
    if target_section == "Completed Work Details" and "Completed Work Details" not in sections:
        # Insert before "In Progress" or "Planned" sections
        if "In Progress Work Details" in sections:
            create_missing_section(lines, "Completed Work Details", "Task Execution Status")
        elif "Planned Work Details" in sections:
            create_missing_section(lines, "Completed Work Details", "Task Execution Status")
        else:
            print(f"⚠️  No section headers found in {wp_file}", file=sys.stderr)
            return False
        # Re-find sections after creation
        sections = find_section_boundaries(lines)

    if target_section == "In Progress Work Details" and "In Progress Work Details" not in sections:
        # Insert after "Completed" or before "Planned"
        if "Completed Work Details" in sections:
            create_missing_section(lines, "In Progress Work Details", "Completed Work Details")
        elif "Planned Work Details" in sections:
            create_missing_section(lines, "In Progress Work Details", "Task Execution Status")
        else:
            print(f"⚠️  No section headers found in {wp_file}", file=sys.stderr)
            return False
        # Re-find sections after creation
        sections = find_section_boundaries(lines)

    # Find task block
    task_start, task_end = find_task_block(lines, task_id)
    if task_start is None:
        print(f"ℹ️  Task {task_id} not found in narrative sections (may not exist yet)", file=sys.stderr)
        return True  # Not an error, task might not have narrative yet

    # Find current section
    current_section = find_current_section(lines, task_start, sections)
    if not current_section:
        print(f"⚠️  Could not determine current section for {task_id}", file=sys.stderr)
        return False

    # If section changed, move task block
    if current_section != target_section:
        print(f"ℹ️  Moving {task_id} from '{current_section}' → '{target_section}'", file=sys.stderr)

        # Extract task block
        task_block = lines[task_start:task_end]

        # Remove from old location
        del lines[task_start:task_end]

        # Re-find section boundaries after deletion
        sections = find_section_boundaries(lines)

        # Insert after target section header
        if target_section in sections:
            insert_pos = sections[target_section] + 1
            # Skip blank lines after section header
            while insert_pos < len(lines) and lines[insert_pos].strip() == "":
                insert_pos += 1

            # Insert task block with blank line before
            lines.insert(insert_pos, "\n")
            for i, line in enumerate(task_block):
                lines.insert(insert_pos + 1 + i, line)

            print(f"✅ Moved {task_id} narrative section", file=sys.stderr)
        else:
            print(f"⚠️  Target section '{target_section}' not found", file=sys.stderr)
            return False

    # Update status indicators in task narrative
    for i, line in enumerate(lines):
        # Update section header emoji (### T-XX: ... 🟡)
        if re.match(rf"^### {task_id}:", line):
            # Remove old emoji and add new one
            new_line = re.sub(r' [✅🟡🔴]$', '', line.rstrip())
            new_line = new_line.rstrip() + f" {status_emoji}\n"
            lines[i] = new_line

        # Update "Status:" line within task block
        if re.search(rf"### {task_id}:", "\n".join(lines[max(0,i-10):i])):
            # We're within task block
            if re.match(r'^- \*\*Status\*\*:', line):
                if status_emoji == "✅ Complete":
                    lines[i] = f"- **Status**: Complete\n"
                elif status_emoji == "🟡 In Progress":
                    lines[i] = f"- **Status**: {progress}% Complete\n"
                else:
                    lines[i] = f"- **Status**: Not Started\n"

    # Update WP-level status if first task changes from Not Started
    if status_emoji in ["🟡 In Progress", "✅ Complete"]:
        for i, line in enumerate(lines):
            if line.strip() == "- **Status**: 🔴 Not Started":
                if status_emoji == "✅ Complete":
                    # If going directly to Complete, set WP to In Progress first
                    lines[i] = "- **Status**: 🟡 In Progress\n"
                    print(f"✅ Updated WP status: Not Started → In Progress (task completed)", file=sys.stderr)
                else:
                    lines[i] = "- **Status**: 🟡 In Progress\n"
                    print(f"✅ Updated WP status: Not Started → In Progress", file=sys.stderr)
                break

    # Write back
    with open(wp_file, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print(f"✅ Updated {task_id} narrative status indicators", file=sys.stderr)
    return True

def main():
    if len(sys.argv) != 5:
        print("Usage: python3 update-wp-narrative.py <wp_file> <task_id> <status_emoji> <progress>")
        sys.exit(1)

    wp_file = sys.argv[1]
    task_id = sys.argv[2]
    status_emoji = sys.argv[3]
    progress = sys.argv[4]

    if not Path(wp_file).exists():
        print(f"❌ File not found: {wp_file}", file=sys.stderr)
        sys.exit(2)

    if update_wp_narrative(wp_file, task_id, status_emoji, progress):
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
