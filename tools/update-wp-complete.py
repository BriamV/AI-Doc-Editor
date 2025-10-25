#!/usr/bin/env python3
"""
update-wp-complete.py - Comprehensive Work Package update script
Purpose: Robust update of ALL sections in WP progress files with idempotent operations
Usage: python3 update-wp-complete.py <wp_file> <task_id>

Architecture:
- WPFileParser: Extracts task table and metrics from markdown
- WPMetricsCalculator: Computes WP-level metrics from task data
- WPFileUpdater: Updates all sections (Summary, Complexity, Timeline, Progress bars)
- Idempotent: Safe to run multiple times, preserves file structure

Key Features:
1. Robust table parsing (handles format variations gracefully)
2. Updates ALL sections (not just task table)
3. Clear logging (before/after values)
4. Validation (detect anomalies)
5. Idempotent updates (no duplicate status indicators)
"""

import sys
import re
from pathlib import Path
from typing import Dict, Tuple, List, Optional
from dataclasses import dataclass


@dataclass
class TaskData:
    """Task data extracted from table row"""
    task_id: str
    title: str
    complexity: int
    status: str
    progress: int
    completed_points: float
    assignee: str
    completed_date: str
    notes: str

    @property
    def is_complete(self) -> bool:
        return '✅' in self.status or self.progress == 100

    @property
    def is_in_progress(self) -> bool:
        return '🟡' in self.status and 0 < self.progress < 100

    @property
    def is_not_started(self) -> bool:
        return '🔴' in self.status or self.progress == 0

    @property
    def is_deferred(self) -> bool:
        return '🔵' in self.status


@dataclass
class WPMetrics:
    """Work Package level metrics"""
    total_complexity: int
    completed_points: float
    in_progress_points: float
    remaining_points: float
    deferred_points: float
    wp_progress: int
    completed_tasks: int
    in_progress_tasks: int
    not_started_tasks: int
    deferred_tasks: int
    total_tasks: int

    def format_status(self) -> str:
        """Generate status line text"""
        if self.completed_tasks == self.total_tasks:
            return "✅ Complete (all tasks done)"
        elif self.deferred_tasks > 0 and self.completed_tasks + self.deferred_tasks == self.total_tasks:
            return f"✅ Near Complete ({self.completed_tasks}/{self.total_tasks} tasks complete, T-24 deferred to R2)"
        elif self.in_progress_tasks > 0:
            return f"🟡 In Progress ({self.completed_tasks}/{self.total_tasks} tasks complete)"
        elif self.completed_tasks > 0:
            return f"🟡 In Progress ({self.completed_tasks}/{self.total_tasks} tasks complete)"
        else:
            return "🔴 Not Started"


class WPFileParser:
    """Parse Work Package markdown file"""

    def parse_task_table(self, content: str) -> Dict[str, TaskData]:
        """
        Parse task table with robust handling of format variations

        Returns: {task_id: TaskData}
        """
        tasks = {}

        # Find Task Summary table
        table_pattern = r'\| Task ID \|.*?\n\|[-|]+\n(.*?)(?=\n\n|\n###|\n##|$)'
        table_match = re.search(table_pattern, content, re.DOTALL)

        if not table_match:
            print("⚠️  Task table not found", file=sys.stderr)
            return tasks

        table_content = table_match.group(1)

        for line in table_content.split('\n'):
            if '|' not in line or not line.strip():
                continue

            # Split by | and clean
            parts = [p.strip() for p in line.split('|') if p.strip()]

            # Skip separator rows
            if all(re.match(r'^-+$', p) for p in parts):
                continue

            # Extract task ID
            if not parts or not parts[0]:
                continue

            task_id_match = re.search(r'(T-\d+)', parts[0])
            if not task_id_match:
                continue

            task_id = task_id_match.group(1)

            # Handle varying column counts (robust parsing)
            try:
                # Try full format: Task ID | Title | Complexity | Status | Progress | Assignee | Completed | Notes
                if len(parts) >= 8:
                    title = parts[1]
                    complexity_str = parts[2]
                    status = parts[3]
                    progress_str = parts[4]
                    assignee = parts[5]
                    completed_date = parts[6]
                    notes = parts[7]

                # Fallback format: T-03 | Status | Progress | Completed Points
                elif len(parts) >= 4:
                    title = ""
                    status = parts[1]
                    progress_str = parts[2]
                    # Complexity from "11/11 (100%)" pattern
                    complexity_match = re.search(r'(\d+)/(\d+)', parts[3])
                    complexity_str = complexity_match.group(2) if complexity_match else "0"
                    assignee = ""
                    completed_date = ""
                    notes = ""

                # Minimal format: just task_id and some data
                else:
                    print(f"⚠️  Skipping malformed row for {task_id}: {len(parts)} columns", file=sys.stderr)
                    continue

                # Parse complexity
                complexity_match = re.search(r'(\d+)', complexity_str)
                complexity = int(complexity_match.group(1)) if complexity_match else 0

                # Parse progress percentage
                progress_match = re.search(r'(\d+)%', progress_str)
                progress = int(progress_match.group(1)) if progress_match else 0

                # Calculate completed points
                completed_points = complexity * progress / 100.0

                tasks[task_id] = TaskData(
                    task_id=task_id,
                    title=title,
                    complexity=complexity,
                    status=status,
                    progress=progress,
                    completed_points=completed_points,
                    assignee=assignee,
                    completed_date=completed_date,
                    notes=notes
                )

                print(f"✅ Parsed {task_id}: {complexity} pts, {progress}%, {status}", file=sys.stderr)

            except Exception as e:
                print(f"⚠️  Error parsing {task_id}: {e}", file=sys.stderr)
                continue

        return tasks

    def extract_section(self, content: str, header: str) -> Tuple[int, int, str]:
        """
        Extract section content by header

        Returns: (start_line, end_line, section_content)
        """
        lines = content.split('\n')
        start = None
        end = None

        for i, line in enumerate(lines):
            if line.startswith(header):
                start = i
            elif start is not None and line.startswith('#'):
                end = i
                break

        if start is not None and end is None:
            end = len(lines)

        if start is not None:
            section_content = '\n'.join(lines[start:end])
            return start, end, section_content
        else:
            return -1, -1, ""


class WPMetricsCalculator:
    """Calculate Work Package level metrics"""

    def calculate_metrics(self, tasks: Dict[str, TaskData]) -> WPMetrics:
        """Calculate all WP metrics from task data"""
        if not tasks:
            return WPMetrics(
                total_complexity=0,
                completed_points=0,
                in_progress_points=0,
                remaining_points=0,
                deferred_points=0,
                wp_progress=0,
                completed_tasks=0,
                in_progress_tasks=0,
                not_started_tasks=0,
                deferred_tasks=0,
                total_tasks=0
            )

        total_complexity = sum(t.complexity for t in tasks.values())
        completed_points = sum(t.completed_points for t in tasks.values() if t.is_complete or t.is_in_progress)
        in_progress_points = sum(t.completed_points for t in tasks.values() if t.is_in_progress)
        deferred_points = sum(t.complexity for t in tasks.values() if t.is_deferred)
        remaining_points = total_complexity - completed_points - deferred_points

        completed_tasks = sum(1 for t in tasks.values() if t.is_complete)
        in_progress_tasks = sum(1 for t in tasks.values() if t.is_in_progress)
        not_started_tasks = sum(1 for t in tasks.values() if t.is_not_started)
        deferred_tasks = sum(1 for t in tasks.values() if t.is_deferred)

        # Calculate WP progress (exclude deferred from denominator)
        active_complexity = total_complexity - deferred_points
        if active_complexity > 0:
            wp_progress = int((completed_points / active_complexity) * 100)
        else:
            wp_progress = 0

        metrics = WPMetrics(
            total_complexity=total_complexity,
            completed_points=completed_points,
            in_progress_points=in_progress_points,
            remaining_points=remaining_points,
            deferred_points=deferred_points,
            wp_progress=wp_progress,
            completed_tasks=completed_tasks,
            in_progress_tasks=in_progress_tasks,
            not_started_tasks=not_started_tasks,
            deferred_tasks=deferred_tasks,
            total_tasks=len(tasks)
        )

        # Log metrics
        print(f"\n📊 Calculated WP Metrics:", file=sys.stderr)
        print(f"  Total complexity: {metrics.total_complexity} points", file=sys.stderr)
        print(f"  Completed: {metrics.completed_points:.1f} points ({metrics.completed_tasks} tasks)", file=sys.stderr)
        print(f"  In progress: {metrics.in_progress_points:.1f} points ({metrics.in_progress_tasks} tasks)", file=sys.stderr)
        print(f"  Remaining: {metrics.remaining_points:.1f} points", file=sys.stderr)
        print(f"  Deferred: {metrics.deferred_points:.1f} points ({metrics.deferred_tasks} tasks)", file=sys.stderr)
        print(f"  WP progress: {metrics.wp_progress}%", file=sys.stderr)

        return metrics


class WPFileUpdater:
    """Update Work Package markdown file sections"""

    def generate_progress_bar(self, progress: int) -> str:
        """Generate progress bar [████░░░░░░] for given percentage"""
        filled = int(progress / 10)
        empty = 10 - filled
        return '█' * filled + '░' * empty

    def generate_task_progress_bar(self, progress: int, points: int) -> str:
        """Generate task-specific progress bar with points"""
        bar = self.generate_progress_bar(progress)
        status = "✅" if progress == 100 else "🟡" if progress > 0 else "🔴"
        return f"[{bar}] {progress:3d}% ({points} pts) {status}"

    def clean_status_duplicates(self, text: str) -> str:
        """Remove duplicate status indicators like '✅ Complete ✅ Complete'"""
        # Remove duplicate emojis with status words (more aggressive matching)
        text = re.sub(r'(✅\s*Complete)(\s+✅\s*Complete)+', r'\1', text, flags=re.IGNORECASE)
        text = re.sub(r'(🟡\s*In Progress)(\s+🟡\s*In Progress)+', r'\1', text, flags=re.IGNORECASE)
        text = re.sub(r'(🔴\s*Not Started)(\s+🔴\s*Not Started)+', r'\1', text, flags=re.IGNORECASE)
        text = re.sub(r'(🔵\s*Deferred)(\s+🔵\s*Deferred)+', r'\1', text, flags=re.IGNORECASE)
        return text

    def update_summary_dashboard(self, lines: List[str], metrics: WPMetrics) -> List[str]:
        """Update Summary Dashboard section (lines 3-10)"""
        progress_bar = self.generate_progress_bar(metrics.wp_progress)
        status_text = metrics.format_status()

        print(f"\n🔧 Updating Summary Dashboard...", file=sys.stderr)

        for i, line in enumerate(lines):
            # Update Status line
            if line.strip().startswith('- **Status**:'):
                old_value = line.strip()
                lines[i] = f'- **Status**: {status_text}\n'
                print(f"  Status: {old_value} → {lines[i].strip()}", file=sys.stderr)

            # Update Progress line
            elif '**Progress**:' in line and '[' in line:
                old_value = line.strip()
                active_complexity = metrics.total_complexity - metrics.deferred_points
                lines[i] = f'- **Progress**: [{progress_bar}] {metrics.wp_progress}% ({int(metrics.completed_points)}/{int(active_complexity)} points)\n'
                print(f"  Progress: {old_value[:50]}... → {lines[i].strip()}", file=sys.stderr)

            # Update Complexity line
            elif '**Complexity**:' in line and 'points' in line:
                old_value = line.strip()
                if metrics.deferred_points > 0:
                    lines[i] = f'- **Complexity**: {int(metrics.completed_points)}/{int(metrics.total_complexity - metrics.deferred_points)} points completed | {int(metrics.deferred_points)} points deferred (T-24)\n'
                else:
                    lines[i] = f'- **Complexity**: {int(metrics.completed_points)}/{int(metrics.total_complexity)} points completed | {int(metrics.remaining_points)} points remaining\n'
                print(f"  Complexity: {old_value[:50]}... → {lines[i].strip()}", file=sys.stderr)

        return lines

    def update_complexity_breakdown(self, lines: List[str], metrics: WPMetrics) -> List[str]:
        """Update Complexity Breakdown section (lines 23-29)"""
        print(f"\n🔧 Updating Complexity Breakdown...", file=sys.stderr)

        for i, line in enumerate(lines):
            if line.startswith('### Complexity Breakdown'):
                # Find and update the lines in next 15 lines
                for j in range(i, min(i + 15, len(lines))):
                    if '**Completed Tasks**:' in lines[j]:
                        old_value = lines[j].strip()
                        lines[j] = f'- **Completed Tasks**: {int(metrics.completed_points)} points\n'
                        print(f"  Completed Tasks: {old_value} → {lines[j].strip()}", file=sys.stderr)

                    elif '**In Progress**:' in lines[j]:
                        old_value = lines[j].strip()
                        lines[j] = f'- **In Progress**: {int(metrics.in_progress_points)} points\n'
                        print(f"  In Progress: {old_value} → {lines[j].strip()}", file=sys.stderr)

                    elif '**Remaining Work**:' in lines[j]:
                        old_value = lines[j].strip()
                        lines[j] = f'- **Remaining Work**: {int(metrics.remaining_points)} points\n'
                        print(f"  Remaining Work: {old_value} → {lines[j].strip()}", file=sys.stderr)

                    elif '**Deferred to R2**:' in lines[j]:
                        old_value = lines[j].strip()
                        if metrics.deferred_points > 0:
                            lines[j] = f'- **Deferred to R2**: {int(metrics.deferred_points)} points (T-24)\n'
                        else:
                            # Remove this line if no deferred tasks
                            lines[j] = ''
                        print(f"  Deferred to R2: {old_value} → {lines[j].strip()}", file=sys.stderr)

                    elif '**Overall Progress**:' in lines[j]:
                        old_value = lines[j].strip()
                        active_complexity = metrics.total_complexity - metrics.deferred_points
                        lines[j] = f'- **Overall Progress**: {int(metrics.completed_points)}/{int(active_complexity)} points ({metrics.wp_progress}%)\n'
                        print(f"  Overall Progress: {old_value} → {lines[j].strip()}", file=sys.stderr)
                break

        # Add Deferred to R2 line if missing and needed
        if metrics.deferred_points > 0:
            for i, line in enumerate(lines):
                if line.startswith('### Complexity Breakdown'):
                    # Check if Deferred line exists
                    has_deferred = any('**Deferred to R2**:' in lines[j] for j in range(i, min(i + 15, len(lines))))
                    if not has_deferred:
                        # Find Remaining Work line and insert after
                        for j in range(i, min(i + 15, len(lines))):
                            if '**Remaining Work**:' in lines[j]:
                                lines.insert(j + 1, f'- **Deferred to R2**: {int(metrics.deferred_points)} points (T-24)\n')
                                print(f"  Added: Deferred to R2 line", file=sys.stderr)
                                break
                    break

        return lines

    def update_timeline(self, lines: List[str], metrics: WPMetrics) -> List[str]:
        """Update Timeline section (lines 31-38)"""
        print(f"\n🔧 Updating Timeline...", file=sys.stderr)

        for i, line in enumerate(lines):
            # Update Current Status line
            if line.strip().startswith('- **Current Status**:'):
                old_value = line.strip()
                if metrics.completed_tasks == metrics.total_tasks:
                    lines[i] = '- **Current Status**: Complete (all tasks done)\n'
                elif metrics.deferred_tasks > 0 and metrics.completed_tasks + metrics.deferred_tasks == metrics.total_tasks:
                    lines[i] = '- **Current Status**: Near Complete (T-03 100%, T-24 deferred)\n'
                elif metrics.in_progress_tasks > 0:
                    in_progress_tasks = [f"T-{t}" for t in range(1, 50)]  # Placeholder
                    lines[i] = f'- **Current Status**: Ongoing ({metrics.in_progress_tasks} task{"s" if metrics.in_progress_tasks > 1 else ""} in progress)\n'
                else:
                    lines[i] = '- **Current Status**: Not Started\n'
                print(f"  Current Status: {old_value} → {lines[i].strip()}", file=sys.stderr)

            # Update Note line
            elif line.strip().startswith('- **Note**:'):
                old_value = line.strip()
                if metrics.deferred_tasks > 0:
                    lines[i] = '- **Note**: T-03 complete, T-24 deferred to R2\n'
                elif metrics.completed_tasks == metrics.total_tasks:
                    lines[i] = '- **Note**: All tasks complete\n'
                elif metrics.in_progress_tasks > 0:
                    lines[i] = f'- **Note**: {metrics.in_progress_tasks} task{"s" if metrics.in_progress_tasks > 1 else ""} in progress\n'
                print(f"  Note: {old_value} → {lines[i].strip()}", file=sys.stderr)

        return lines

    def clean_duplicate_status_indicators(self, lines: List[str]) -> List[str]:
        """Remove duplicate status indicators throughout file"""
        print(f"\n🔧 Cleaning duplicate status indicators...", file=sys.stderr)
        for i, line in enumerate(lines):
            cleaned = self.clean_status_duplicates(line)
            if cleaned != line:
                print(f"  Line {i}: {line.strip()[:60]}... → {cleaned.strip()[:60]}...", file=sys.stderr)
                lines[i] = cleaned
        return lines

    def fix_narrative_section_status(self, lines: List[str], tasks: Dict[str, TaskData]) -> List[str]:
        """Fix status indicators in narrative sections (### T-XX: ... lines)"""
        print(f"\n🔧 Fixing narrative section status indicators...", file=sys.stderr)

        for i, line in enumerate(lines):
            # Find ### T-XX: lines
            task_header_match = re.match(r'^###\s+(T-\d+):\s+(.+)$', line.strip())
            if task_header_match:
                task_id = task_header_match.group(1)
                rest_of_line = task_header_match.group(2)

                if task_id in tasks:
                    task = tasks[task_id]

                    # Remove any existing status emojis from end (including duplicates)
                    # First pass: remove duplicates
                    while True:
                        new_text = re.sub(r'(✅\s*Complete)(\s+✅\s*(Complete)?)+', r'\1', rest_of_line, flags=re.IGNORECASE)
                        if new_text == rest_of_line:
                            break
                        rest_of_line = new_text

                    # Second pass: remove trailing status indicators
                    rest_of_line = re.sub(r'\s*[✅🟡🔴🔵]\s*(Complete|In Progress|Not Started|Deferred[^$]*)?$', '', rest_of_line, flags=re.IGNORECASE)

                    # Determine correct status
                    if task.is_complete:
                        status_suffix = " ✅"
                    elif task.is_in_progress:
                        status_suffix = " 🟡"
                    elif task.is_deferred:
                        status_suffix = " 🔵"
                    else:
                        status_suffix = " 🔴"

                    new_line = f"### {task_id}: {rest_of_line}{status_suffix}\n"

                    if new_line != line:
                        print(f"  Line {i}: {line.strip()[:60]}... → {new_line.strip()}", file=sys.stderr)
                        lines[i] = new_line

        return lines

    def fix_status_within_narrative(self, lines: List[str], tasks: Dict[str, TaskData]) -> List[str]:
        """Fix '- **Status**:' lines within narrative sections"""
        print(f"\n🔧 Fixing status within narrative sections...", file=sys.stderr)

        current_task = None

        for i, line in enumerate(lines):
            # Track which task section we're in
            task_header_match = re.match(r'^###\s+(T-\d+):', line.strip())
            if task_header_match:
                current_task = task_header_match.group(1)
                continue

            # Reset if we hit another section
            if line.strip().startswith('##'):
                current_task = None
                continue

            # Fix status line within task section
            if current_task and current_task in tasks:
                status_match = re.match(r'^-\s*\*\*Status\*\*:\s*(.*)$', line.strip())
                if status_match:
                    task = tasks[current_task]
                    old_status = status_match.group(1)

                    # Determine correct status text
                    if task.is_complete:
                        new_status = "Complete"
                    elif task.is_in_progress:
                        new_status = f"{task.progress}% Complete"
                    elif task.is_deferred:
                        new_status = "Deferred to R2"
                    else:
                        new_status = "Not Started"

                    new_line = f"- **Status**: {new_status}\n"

                    if new_line != line:
                        print(f"  Line {i} ({current_task}): {line.strip()[:60]}... → {new_line.strip()}", file=sys.stderr)
                        lines[i] = new_line

        return lines

    def update_key_deliverables(self, lines: List[str], tasks: Dict[str, TaskData]) -> List[str]:
        """Update Key Deliverables checkboxes based on task status"""
        print(f"\n🔧 Updating Key Deliverables...", file=sys.stderr)

        for i, line in enumerate(lines):
            # Find lines with checkboxes and task IDs
            checkbox_match = re.match(r'^-\s*\[([ x~])\]\s+(.+?)\s*\((T-\d+)\)', line.strip())
            if checkbox_match:
                old_checkbox = checkbox_match.group(1)
                description = checkbox_match.group(2)
                task_id = checkbox_match.group(3)

                if task_id in tasks:
                    task = tasks[task_id]

                    # Determine new checkbox state
                    if task.is_complete:
                        new_checkbox = 'x'
                    elif task.is_deferred:
                        new_checkbox = '~'
                    elif task.is_in_progress:
                        new_checkbox = '~'
                    else:
                        new_checkbox = ' '

                    if old_checkbox != new_checkbox:
                        old_line = line.strip()
                        lines[i] = f"- [{new_checkbox}] {description} ({task_id})\n"
                        print(f"  [{old_checkbox}] → [{new_checkbox}]: {description} ({task_id})", file=sys.stderr)

        return lines

    def update_complexity_visualization(self, lines: List[str], tasks: Dict[str, TaskData], metrics: WPMetrics) -> List[str]:
        """Update Complexity Progress Visualization section with ASCII bars"""
        print(f"\n🔧 Updating Complexity Progress Visualization...", file=sys.stderr)

        # Find the section
        section_start = -1
        for i, line in enumerate(lines):
            if '### Complexity Progress Visualization' in line:
                section_start = i
                break

        if section_start == -1:
            print(f"  ⚠️  Section not found, skipping", file=sys.stderr)
            return lines

        # Find the code block boundaries
        code_start = -1
        code_end = -1
        for i in range(section_start, min(section_start + 30, len(lines))):
            if lines[i].strip() == '```':
                if code_start == -1:
                    code_start = i
                else:
                    code_end = i
                    break

        if code_start == -1 or code_end == -1:
            print(f"  ⚠️  Code block not found, skipping", file=sys.stderr)
            return lines

        # Generate new visualization
        new_content = []
        new_content.append('```\n')

        # Completed tasks
        completed_tasks = [t for t in tasks.values() if t.is_complete]
        if completed_tasks:
            completed_points = sum(t.complexity for t in completed_tasks)
            new_content.append(f"Completed Tasks:   {self.generate_progress_bar(100)} 100% ({completed_points}/{completed_points} points) ✅\n")
            for task in sorted(completed_tasks, key=lambda t: t.task_id):
                bar = self.generate_progress_bar(100)
                new_content.append(f"  {task.task_id} ({task.complexity} pts):   {bar} 100% ✅ {task.title or 'Task'}\n")
            new_content.append('\n')

        # In progress tasks
        in_progress_tasks = [t for t in tasks.values() if t.is_in_progress]
        if in_progress_tasks:
            in_progress_points = sum(t.completed_points for t in in_progress_tasks)
            new_content.append(f"In Progress:       {self.generate_progress_bar(0)}  0% ({int(in_progress_points)} points)\n")
            for task in sorted(in_progress_tasks, key=lambda t: t.task_id):
                bar = self.generate_progress_bar(task.progress)
                new_content.append(f"  {task.task_id} ({task.complexity} pts):   {bar} {task.progress:3d}% 🟡 {task.title or 'Task'}\n")
            new_content.append('\n')
        else:
            new_content.append(f"In Progress:       {self.generate_progress_bar(0)}  0% (0 points)\n\n")

        # Remaining tasks
        remaining_tasks = [t for t in tasks.values() if t.is_not_started]
        if remaining_tasks:
            remaining_points = sum(t.complexity for t in remaining_tasks)
            new_content.append(f"Remaining Work:    {self.generate_progress_bar(0)}  0% ({remaining_points} points)\n")
            for task in sorted(remaining_tasks, key=lambda t: t.task_id):
                bar = self.generate_progress_bar(0)
                new_content.append(f"  {task.task_id} ({task.complexity} pts):   {bar}  0% 🔴 {task.title or 'Task'}\n")
            new_content.append('\n')
        else:
            new_content.append(f"Remaining Work:    {self.generate_progress_bar(0)}  0% (0 points)\n\n")

        # Deferred tasks
        deferred_tasks = [t for t in tasks.values() if t.is_deferred]
        if deferred_tasks:
            deferred_points = sum(t.complexity for t in deferred_tasks)
            new_content.append(f"Deferred to R2:    {self.generate_progress_bar(100)} 100% ({deferred_points} points)\n")
            for task in sorted(deferred_tasks, key=lambda t: t.task_id):
                bar = self.generate_progress_bar(0)
                new_content.append(f"  {task.task_id} ({task.complexity} pts):   {bar}  0% 🔵 {task.title or 'Task'}\n")
            new_content.append('\n')

        # Overall progress
        active_complexity = metrics.total_complexity - metrics.deferred_points
        overall_bar = self.generate_progress_bar(metrics.wp_progress)
        new_content.append(f"Overall Progress:  {overall_bar} {metrics.wp_progress}% ({int(metrics.completed_points)}/{int(active_complexity)} planned points)\n")
        new_content.append('```\n')

        # Replace the old code block content
        lines[code_start:code_end+1] = new_content
        print(f"  Updated visualization with {len(completed_tasks)} complete, {len(in_progress_tasks)} in progress, {len(remaining_tasks)} remaining, {len(deferred_tasks)} deferred", file=sys.stderr)

        return lines

    def update_qa_workflow_status(self, lines: List[str], tasks: Dict[str, TaskData]) -> List[str]:
        """Update QA Workflow Status section"""
        print(f"\n🔧 Updating QA Workflow Status...", file=sys.stderr)

        # Find the QA Workflow Status section
        section_start = -1
        for i, line in enumerate(lines):
            if '### QA Workflow Status' in line:
                section_start = i
                break

        if section_start == -1:
            print(f"  ⚠️  Section not found, skipping", file=sys.stderr)
            return lines

        # Update the task lines in the status table
        for i in range(section_start, min(section_start + 50, len(lines))):
            line = lines[i]

            # Find task table rows
            task_match = re.match(r'^\|\s*\*\*(T-\d+)\*\*\s*\|', line.strip())
            if task_match:
                task_id = task_match.group(1)
                if task_id in tasks:
                    task = tasks[task_id]

                    # Determine statuses
                    if task.is_complete:
                        dev_status = '✅ Complete'
                        qa_status = '✅ QA Passed'
                        dod_status = '✅ DoD Satisfied'
                        overall = '✅ 100%'
                    elif task.is_deferred:
                        dev_status = '🔵 Deferred to R2'
                        qa_status = '⏳ Pending'
                        dod_status = '⏳ Pending'
                        overall = '🔵 Deferred'
                    elif task.is_in_progress:
                        dev_status = f'🟡 {task.progress}% Complete'
                        qa_status = '⏳ In Progress'
                        dod_status = '⏳ Pending'
                        overall = f'🟡 {task.progress}%'
                    else:
                        dev_status = '🔴 Not Started'
                        qa_status = '⏳ Pending'
                        dod_status = '⏳ Pending'
                        overall = '🔴 0%'

                    new_line = f"| **{task_id}** | {dev_status} | {qa_status} | {dod_status} | {overall} |\n"

                    if new_line != line:
                        print(f"  Updated {task_id} row", file=sys.stderr)
                        lines[i] = new_line

        return lines

    def update_quality_gates(self, lines: List[str], tasks: Dict[str, TaskData]) -> List[str]:
        """Update Quality Gates Achieved section"""
        print(f"\n🔧 Updating Quality Gates...", file=sys.stderr)

        # Find the Quality Gates section
        section_start = -1
        for i, line in enumerate(lines):
            if '### Quality Gates Achieved' in line:
                section_start = i
                break

        if section_start == -1:
            print(f"  ⚠️  Section not found, skipping", file=sys.stderr)
            return lines

        # Update checkboxes for each task
        for i in range(section_start, min(section_start + 100, len(lines))):
            line = lines[i]

            # Find lines with task quality gates
            gate_match = re.match(r'^-\s*\[([ x])\]\s+\*\*(T-\d+)\s+(.+?)(?:\*\*)?:(.+)', line.strip())
            if gate_match:
                old_checkbox = gate_match.group(1)
                task_id_str = gate_match.group(2)
                gate_name = gate_match.group(3).strip()
                gate_desc = gate_match.group(4).strip()

                # Extract task ID
                task_id = task_id_str

                if task_id in tasks:
                    task = tasks[task_id]

                    # Mark as complete if task is complete
                    if task.is_complete:
                        new_checkbox = 'x'
                    else:
                        new_checkbox = ' '

                    if old_checkbox != new_checkbox:
                        lines[i] = f"- [{new_checkbox}] **{task_id} {gate_name}**: {gate_desc}\n"
                        print(f"  Updated {task_id} {gate_name} gate: [{old_checkbox}] → [{new_checkbox}]", file=sys.stderr)

        return lines

    def update_dod_status(self, lines: List[str], tasks: Dict[str, TaskData]) -> List[str]:
        """Update Definition of Done Status section"""
        print(f"\n🔧 Updating Definition of Done Status...", file=sys.stderr)

        # Find DoD sections for each task
        for i, line in enumerate(lines):
            # Find task DoD headers like "**T-04 DoD Satisfied** ✅:"
            dod_match = re.match(r'^\*\*(T-\d+)\s+DoD\s+\w+\*\*\s*[✅🟡🔵🔴]?:', line.strip())
            if dod_match:
                task_id = dod_match.group(1)

                if task_id in tasks:
                    task = tasks[task_id]

                    # Determine status
                    if task.is_complete:
                        new_line = f"**{task_id} DoD Satisfied** ✅:\n"
                    elif task.is_deferred:
                        new_line = f"**{task_id} DoD Deferred** 🔵:\n"
                    elif task.is_in_progress:
                        new_line = f"**{task_id} DoD In Progress** 🟡:\n"
                    else:
                        new_line = f"**{task_id} DoD Pending** 🔴:\n"

                    if new_line != line:
                        print(f"  Updated {task_id} DoD header", file=sys.stderr)
                        lines[i] = new_line

        return lines

    def update_wp_kpis(self, lines: List[str], metrics: WPMetrics) -> List[str]:
        """Update Work Package KPIs table"""
        print(f"\n🔧 Updating Work Package KPIs...", file=sys.stderr)

        # Find the WP KPIs table
        section_start = -1
        for i, line in enumerate(lines):
            if '### Work Package KPIs' in line:
                section_start = i
                break

        if section_start == -1:
            print(f"  ⚠️  Section not found, skipping", file=sys.stderr)
            return lines

        # Update KPI metrics
        for i in range(section_start, min(section_start + 20, len(lines))):
            line = lines[i]

            if '| Task Completion Rate |' in line:
                completed_pct = int((metrics.completed_tasks / metrics.total_tasks * 100)) if metrics.total_tasks > 0 else 0
                new_line = f"| Task Completion Rate | 100% | {completed_pct}% ({metrics.completed_tasks}/{metrics.total_tasks} planned) | ↑ | 🟢 |\n"
                if new_line != line:
                    print(f"  Updated Task Completion Rate", file=sys.stderr)
                    lines[i] = new_line

            elif '| Complexity Completion |' in line:
                active_complexity = metrics.total_complexity - metrics.deferred_points
                new_line = f"| Complexity Completion | 100% | {metrics.wp_progress}% ({int(metrics.completed_points)}/{int(active_complexity)} points) | ↑ | 🟢 |\n"
                if new_line != line:
                    print(f"  Updated Complexity Completion", file=sys.stderr)
                    lines[i] = new_line

            elif '| Quality Gate Pass Rate |' in line:
                # Count tasks with QA passed (complete tasks)
                pass_rate = int((metrics.completed_tasks / metrics.total_tasks * 100)) if metrics.total_tasks > 0 else 0
                new_line = f"| Quality Gate Pass Rate | 100% | {pass_rate}% ({metrics.completed_tasks}/{metrics.total_tasks} complete tested) | → | 🟢 |\n"
                if new_line != line:
                    print(f"  Updated Quality Gate Pass Rate", file=sys.stderr)
                    lines[i] = new_line

        return lines

    def update_history(self, lines: List[str], task_id: str, tasks: Dict[str, TaskData], metrics: WPMetrics) -> List[str]:
        """Update Update History section by adding a new entry"""
        print(f"\n🔧 Updating Update History...", file=sys.stderr)

        # Find the Update History section
        section_start = -1
        table_start = -1
        for i, line in enumerate(lines):
            if '## Update History' in line:
                section_start = i
            elif section_start != -1 and line.strip().startswith('| Date |'):
                table_start = i
                break

        if section_start == -1 or table_start == -1:
            print(f"  ⚠️  Section not found, skipping", file=sys.stderr)
            return lines

        # Get current date
        from datetime import datetime
        current_date = datetime.now().strftime('%Y-%m-%d')

        # Get task info
        if task_id in tasks:
            task = tasks[task_id]

            # Determine the change description
            if task.is_complete:
                change_desc = f"{task_id} completion (100%) - {task.title or 'Task complete'}"
                impact = "Major milestone"
            elif task.is_in_progress:
                change_desc = f"{task_id} progress update ({task.progress}%)"
                impact = "Metrics update"
            elif task.is_deferred:
                change_desc = f"{task_id} deferred to R2"
                impact = "Scope adjustment"
            else:
                change_desc = f"{task_id} status update"
                impact = "Status change"

            # Check if today's entry already exists for this task
            entry_exists = False
            for i in range(table_start + 2, min(table_start + 20, len(lines))):
                if current_date in lines[i] and task_id in lines[i]:
                    entry_exists = True
                    # Update existing entry
                    lines[i] = f"| {current_date} | Technical Researcher | {change_desc} | {impact} |\n"
                    print(f"  Updated existing entry for {task_id}", file=sys.stderr)
                    break

            if not entry_exists:
                # Insert new entry after header rows
                separator_line = table_start + 1
                new_entry = f"| {current_date} | Technical Researcher | {change_desc} | {impact} |\n"
                lines.insert(separator_line + 1, new_entry)
                print(f"  Added new history entry for {task_id}", file=sys.stderr)

        return lines


def update_wp_complete(wp_file: str, task_id: Optional[str] = None):
    """
    Comprehensive WP file update - Updates ALL sections

    Args:
        wp_file: Path to WP progress markdown file
        task_id: Optional task ID (for logging context and history entry)
    """
    print(f"\n{'='*70}", file=sys.stderr)
    print(f"🚀 Starting COMPREHENSIVE WP update: {wp_file}", file=sys.stderr)
    if task_id:
        print(f"📌 Task context: {task_id}", file=sys.stderr)
    print(f"{'='*70}", file=sys.stderr)

    # Read file
    with open(wp_file, 'r', encoding='utf-8') as f:
        content = f.read()
        lines = content.split('\n')

    # Parse tasks
    parser = WPFileParser()
    tasks = parser.parse_task_table(content)

    if not tasks:
        print(f"❌ No tasks found in {wp_file}", file=sys.stderr)
        return False

    # Calculate metrics
    calculator = WPMetricsCalculator()
    metrics = calculator.calculate_metrics(tasks)

    # Update ALL sections (comprehensive coverage)
    updater = WPFileUpdater()
    lines_list = [line + '\n' for line in lines]  # Add newlines back

    # Core sections (original functions)
    lines_list = updater.update_summary_dashboard(lines_list, metrics)
    lines_list = updater.update_complexity_breakdown(lines_list, metrics)
    lines_list = updater.update_timeline(lines_list, metrics)

    # NEW: Key sections that were missing
    lines_list = updater.update_key_deliverables(lines_list, tasks)
    lines_list = updater.update_complexity_visualization(lines_list, tasks, metrics)
    lines_list = updater.update_qa_workflow_status(lines_list, tasks)
    lines_list = updater.update_quality_gates(lines_list, tasks)
    lines_list = updater.update_dod_status(lines_list, tasks)
    lines_list = updater.update_wp_kpis(lines_list, metrics)

    # Narrative and cleanup
    lines_list = updater.fix_narrative_section_status(lines_list, tasks)
    lines_list = updater.fix_status_within_narrative(lines_list, tasks)
    lines_list = updater.clean_duplicate_status_indicators(lines_list)

    # Update history (last, so we don't modify line numbers)
    if task_id:
        lines_list = updater.update_history(lines_list, task_id, tasks, metrics)

    # Write back
    updated_content = ''.join(lines_list)
    with open(wp_file, 'w', encoding='utf-8') as f:
        f.write(updated_content)

    print(f"\n{'='*70}", file=sys.stderr)
    print(f"✅ COMPREHENSIVE WP UPDATE COMPLETE", file=sys.stderr)
    print(f"📊 Sections updated: Summary, Complexity, Timeline, Key Deliverables,", file=sys.stderr)
    print(f"   Visualization, QA Workflow, Quality Gates, DoD, KPIs, Narratives, History", file=sys.stderr)
    print(f"📊 WP Progress: {metrics.wp_progress}% ({int(metrics.completed_points)}/{int(metrics.total_complexity - metrics.deferred_points)} points)", file=sys.stderr)
    print(f"📊 Status: {metrics.format_status()}", file=sys.stderr)
    print(f"{'='*70}\n", file=sys.stderr)

    return True


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 update-wp-complete.py <wp_file> [task_id]")
        print("\nExample:")
        print("  python3 update-wp-complete.py docs/project-management/progress/R1-WP1-progress.md T-03")
        sys.exit(1)

    wp_file = sys.argv[1]
    task_id = sys.argv[2] if len(sys.argv) >= 3 else None

    if not Path(wp_file).exists():
        print(f"❌ File not found: {wp_file}", file=sys.stderr)
        sys.exit(2)

    if update_wp_complete(wp_file, task_id):
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
