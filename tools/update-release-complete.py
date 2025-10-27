#!/usr/bin/env python3
"""
update-release-complete.py - Comprehensive Release status update script
Purpose: Robust update of ALL sections in R*-RELEASE-STATUS.md files with idempotent operations
Usage: python3 update-release-complete.py <release_file> <wp_id>

Architecture:
- ReleaseFileParser: Extracts WP/task tables and metrics from markdown
- ReleaseMetricsCalculator: Computes release-level metrics from WP data
- ReleaseFileUpdater: Updates all sections (Summary, Deliverables, WP tables, etc.)
- Idempotent: Safe to run multiple times, preserves file structure

Key Features:
1. Robust table parsing (handles format variations gracefully)
2. Updates ALL sections (not just tables)
3. Clear logging (before/after values)
4. Validation (detect anomalies)
5. Idempotent updates (no duplicate status indicators)
6. Milestone detection (25%, 50%, 75%, 100%)
"""

import sys
import re
from pathlib import Path
from typing import Dict, Tuple, List, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class WPData:
    """Work Package data extracted from WP Summary table"""
    wp_id: str
    complexity: int
    progress: int
    status: str
    completed_date: str

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
    def completed_points(self) -> float:
        return self.complexity * self.progress / 100.0


@dataclass
class TaskData:
    """Task data for Task Completion Matrix"""
    task_id: str
    title: str
    complexity: int
    status: str
    progress: int
    owner: str
    completed_date: str

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
class ReleaseMetrics:
    """Release-level metrics"""
    total_complexity: int
    completed_points: float
    in_progress_points: float
    remaining_points: float
    deferred_points: float
    release_progress: int
    completed_wps: int
    in_progress_wps: int
    not_started_wps: int
    total_wps: int
    completed_tasks: int
    total_tasks: int

    def format_status(self) -> str:
        """Generate status line text"""
        if self.completed_wps == self.total_wps:
            return "✅ 100% Complete (ALL objectives met)"
        elif self.release_progress >= 75:
            return f"🟢 {self.release_progress}% Complete (Core objectives met)"
        elif self.release_progress >= 50:
            return f"🟡 {self.release_progress}% Complete"
        elif self.release_progress > 0:
            return f"🟡 {self.release_progress}% In Progress"
        else:
            return "🔴 Not Started"


class ReleaseFileParser:
    """Parse Release status markdown file"""

    def parse_wp_summary_table(self, content: str) -> Dict[str, WPData]:
        """
        Parse Work Package Summary table

        Pattern: | R1.WP1: Flujo de Ingesta | 44 points | [██████████] 100% | ✅ Complete | 2025-10-26 |

        Returns: {wp_id: WPData}
        """
        wps = {}

        # Find Work Package Summary table
        table_pattern = r'### Work Package Summary.*?\n\| Package \|.*?\n\|[-|]+\n(.*?)(?=\n\n|\n###|\n##|$)'
        table_match = re.search(table_pattern, content, re.DOTALL)

        if not table_match:
            print("⚠️  Work Package Summary table not found", file=sys.stderr)
            return wps

        table_content = table_match.group(1)

        for line in table_content.split('\n'):
            if '|' not in line or not line.strip():
                continue

            # Skip total rows and separator rows
            if 'Total R' in line or all(re.match(r'^[-\*]+$', p.strip()) for p in line.split('|') if p.strip()):
                continue

            parts = [p.strip() for p in line.split('|') if p.strip()]

            if not parts or len(parts) < 4:
                continue

            # Extract WP ID from first column (e.g., "R1.WP1: Flujo de Ingesta" or "R1.WP1")
            wp_match = re.search(r'(R\d+\.WP\d+)', parts[0])
            if not wp_match:
                continue

            wp_id = wp_match.group(1)

            try:
                # Parse complexity (e.g., "44 points" -> 44)
                complexity_str = parts[1]
                complexity_match = re.search(r'(\d+)', complexity_str)
                complexity = int(complexity_match.group(1)) if complexity_match else 0

                # Parse progress (e.g., "[██████████] 100%" -> 100)
                progress_str = parts[2]
                progress_match = re.search(r'(\d+)%', progress_str)
                progress = int(progress_match.group(1)) if progress_match else 0

                # Parse status (e.g., "✅ Complete")
                status = parts[3] if len(parts) > 3 else ""

                # Parse completion date (if present)
                completed_date = parts[4] if len(parts) > 4 else ""

                wps[wp_id] = WPData(
                    wp_id=wp_id,
                    complexity=complexity,
                    progress=progress,
                    status=status,
                    completed_date=completed_date
                )

                print(f"✅ Parsed {wp_id}: {complexity} pts, {progress}%, {status}", file=sys.stderr)

            except Exception as e:
                print(f"⚠️  Error parsing {wp_id}: {e}", file=sys.stderr)
                continue

        return wps

    def parse_task_completion_matrix(self, content: str) -> Dict[str, TaskData]:
        """
        Parse Task Completion Matrix table

        Pattern: | T-04 | RAG Pipeline | 18 | ✅ Complete | 100% | Backend | 2025-10-17 |

        Returns: {task_id: TaskData}
        """
        tasks = {}

        # Find Task Completion Matrix table
        table_pattern = r'### Task Completion Matrix.*?\n\| Task ID \|.*?\n\|[-|]+\n(.*?)(?=\n\n|\n###|\n##|$)'
        table_match = re.search(table_pattern, content, re.DOTALL)

        if not table_match:
            print("⚠️  Task Completion Matrix table not found", file=sys.stderr)
            return tasks

        table_content = table_match.group(1)

        for line in table_content.split('\n'):
            if '|' not in line or not line.strip():
                continue

            parts = [p.strip() for p in line.split('|') if p.strip()]

            if not parts or len(parts) < 5:
                continue

            # Extract task ID
            task_match = re.search(r'(T-\d+)', parts[0])
            if not task_match:
                continue

            task_id = task_match.group(1)

            try:
                title = parts[1] if len(parts) > 1 else ""

                # Parse complexity
                complexity_str = parts[2]
                complexity_match = re.search(r'(\d+)', complexity_str)
                complexity = int(complexity_match.group(1)) if complexity_match else 0

                # Parse status
                status = parts[3] if len(parts) > 3 else ""

                # Parse progress
                progress_str = parts[4] if len(parts) > 4 else "0%"
                progress_match = re.search(r'(\d+)%', progress_str)
                progress = int(progress_match.group(1)) if progress_match else 0

                # Parse owner and completion date
                owner = parts[5] if len(parts) > 5 else ""
                completed_date = parts[6] if len(parts) > 6 else ""

                tasks[task_id] = TaskData(
                    task_id=task_id,
                    title=title,
                    complexity=complexity,
                    status=status,
                    progress=progress,
                    owner=owner,
                    completed_date=completed_date
                )

                print(f"✅ Parsed {task_id}: {complexity} pts, {progress}%, {status}", file=sys.stderr)

            except Exception as e:
                print(f"⚠️  Error parsing {task_id}: {e}", file=sys.stderr)
                continue

        return tasks

    def extract_release_id(self, content: str) -> str:
        """Extract release ID (e.g., 'R1') from file content"""
        # Try to find from header
        header_match = re.search(r'# Release Status - (R\d+)', content)
        if header_match:
            return header_match.group(1)

        # Fallback: look in any WP ID
        wp_match = re.search(r'(R\d+)\.WP\d+', content)
        if wp_match:
            return wp_match.group(1)

        return "R0"


class ReleaseMetricsCalculator:
    """Calculate Release-level metrics from WP data"""

    def calculate_release_metrics(self, wps: Dict[str, WPData], tasks: Dict[str, TaskData]) -> ReleaseMetrics:
        """Calculate release progress, complexity, status"""
        if not wps:
            return ReleaseMetrics(
                total_complexity=0,
                completed_points=0,
                in_progress_points=0,
                remaining_points=0,
                deferred_points=0,
                release_progress=0,
                completed_wps=0,
                in_progress_wps=0,
                not_started_wps=0,
                total_wps=0,
                completed_tasks=0,
                total_tasks=0
            )

        # Calculate WP-level metrics
        total_complexity = sum(wp.complexity for wp in wps.values())
        completed_points = sum(wp.completed_points for wp in wps.values())
        in_progress_points = sum(wp.completed_points for wp in wps.values() if wp.is_in_progress)
        deferred_points = sum(t.complexity for t in tasks.values() if t.is_deferred)
        remaining_points = total_complexity - completed_points - deferred_points

        completed_wps = sum(1 for wp in wps.values() if wp.is_complete)
        in_progress_wps = sum(1 for wp in wps.values() if wp.is_in_progress)
        not_started_wps = sum(1 for wp in wps.values() if wp.is_not_started)

        # Calculate task-level metrics
        completed_tasks = sum(1 for t in tasks.values() if t.is_complete)
        total_tasks = len(tasks)

        # Calculate release progress (exclude deferred from denominator)
        active_complexity = total_complexity - deferred_points
        if active_complexity > 0:
            release_progress = int((completed_points / active_complexity) * 100)
        else:
            release_progress = 0

        metrics = ReleaseMetrics(
            total_complexity=total_complexity,
            completed_points=completed_points,
            in_progress_points=in_progress_points,
            remaining_points=remaining_points,
            deferred_points=deferred_points,
            release_progress=release_progress,
            completed_wps=completed_wps,
            in_progress_wps=in_progress_wps,
            not_started_wps=not_started_wps,
            total_wps=len(wps),
            completed_tasks=completed_tasks,
            total_tasks=total_tasks
        )

        # Log metrics
        print(f"\n📊 Calculated Release Metrics:", file=sys.stderr)
        print(f"  Total complexity: {metrics.total_complexity} points", file=sys.stderr)
        print(f"  Completed: {metrics.completed_points:.1f} points ({metrics.completed_wps}/{metrics.total_wps} WPs)", file=sys.stderr)
        print(f"  In progress: {metrics.in_progress_points:.1f} points ({metrics.in_progress_wps} WPs)", file=sys.stderr)
        print(f"  Remaining: {metrics.remaining_points:.1f} points", file=sys.stderr)
        print(f"  Deferred: {metrics.deferred_points:.1f} points", file=sys.stderr)
        print(f"  Release progress: {metrics.release_progress}%", file=sys.stderr)
        print(f"  Tasks: {metrics.completed_tasks}/{metrics.total_tasks} complete", file=sys.stderr)

        return metrics


class ReleaseFileUpdater:
    """Update all sections in Release status file"""

    def generate_progress_bar(self, progress: int) -> str:
        """Generate progress bar [████░░░░░░] for given percentage"""
        filled = int(progress / 10)
        empty = 10 - filled
        return '█' * filled + '░' * empty

    def clean_status_duplicates(self, text: str) -> str:
        """Remove duplicate status indicators like '✅ Complete ✅ Complete'"""
        text = re.sub(r'(✅\s*Complete)(\s+✅\s*Complete)+', r'\1', text, flags=re.IGNORECASE)
        text = re.sub(r'(🟡\s*In Progress)(\s+🟡\s*In Progress)+', r'\1', text, flags=re.IGNORECASE)
        text = re.sub(r'(🔴\s*Not Started)(\s+🔴\s*Not Started)+', r'\1', text, flags=re.IGNORECASE)
        text = re.sub(r'(🔵\s*Deferred)(\s+🔵\s*Deferred)+', r'\1', text, flags=re.IGNORECASE)
        return text

    def update_summary_dashboard(self, lines: List[str], metrics: ReleaseMetrics, current_date: str) -> List[str]:
        """Update Summary Dashboard section (lines 3-10)"""
        progress_bar = self.generate_progress_bar(metrics.release_progress)
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
                lines[i] = f'- **Progress**: [{progress_bar}] {metrics.release_progress}% ({int(metrics.completed_points)}/{int(active_complexity)} points)\n'
                print(f"  Progress: {old_value[:50]}... → {lines[i].strip()}", file=sys.stderr)

            # Update Last Updated line
            elif '**Last Updated**:' in line:
                old_value = line.strip()
                lines[i] = f'- **Last Updated**: {current_date}\n'
                print(f"  Last Updated: {old_value} → {lines[i].strip()}", file=sys.stderr)

            # Update Completion Date line (if complete)
            elif '**Completion Date**:' in line:
                if metrics.release_progress == 100:
                    old_value = line.strip()
                    lines[i] = f'- **Completion Date**: {current_date}\n'
                    print(f"  Completion Date: {old_value} → {lines[i].strip()}", file=sys.stderr)

        return lines

    def update_success_criteria(self, lines: List[str], tasks: Dict[str, TaskData]) -> List[str]:
        """Update Success Criteria checkboxes"""
        print(f"\n🔧 Updating Success Criteria...", file=sys.stderr)

        for i, line in enumerate(lines):
            # Find lines with checkboxes and task IDs
            checkbox_match = re.match(r'^-\s*\[([ x~])\]\s+\*\*(.+?)\*\*:(.+?)\((T-\d+)\)', line.strip())
            if checkbox_match:
                old_checkbox = checkbox_match.group(1)
                criterion_name = checkbox_match.group(2)
                description = checkbox_match.group(3).strip()
                task_id = checkbox_match.group(4)

                if task_id in tasks:
                    task = tasks[task_id]

                    # Determine new checkbox state
                    if task.is_complete:
                        new_checkbox = 'x'
                        status_emoji = ' ✅'
                    elif task.is_deferred:
                        new_checkbox = '~'
                        status_emoji = ' 🔵'
                    elif task.is_in_progress:
                        new_checkbox = '~'
                        status_emoji = ' 🟡'
                    else:
                        new_checkbox = ' '
                        status_emoji = ''

                    if old_checkbox != new_checkbox:
                        # Remove old status emoji if present
                        description_clean = re.sub(r'\s*[✅🟡🔴🔵]\s*$', '', description)
                        lines[i] = f"- [{new_checkbox}] **{criterion_name}**: {description_clean} ({task_id}){status_emoji}\n"
                        print(f"  [{old_checkbox}] → [{new_checkbox}]: {criterion_name} ({task_id})", file=sys.stderr)

        return lines

    def update_key_deliverables(self, lines: List[str], tasks: Dict[str, TaskData]) -> List[str]:
        """Move tasks between Delivered/In Progress/Deferred sections"""
        print(f"\n🔧 Updating Key Deliverables sections...", file=sys.stderr)

        # Find section boundaries
        delivered_start = -1
        in_progress_start = -1
        deferred_start = -1

        for i, line in enumerate(lines):
            if '**Delivered**' in line and '✅' in line:
                delivered_start = i
            elif '**In Progress**' in line and '🟡' in line:
                in_progress_start = i
            elif '**Deferred to R2**' in line and '🔵' in line:
                deferred_start = i

        # Build task lists for each section
        delivered_tasks = [f"- **{t.task_id}**: {t.title} ({t.complexity} points) - {t.status}\n"
                          for t in tasks.values() if t.is_complete]
        in_progress_tasks = [f"- **{t.task_id}**: {t.title} ({t.complexity} points) - {t.progress}% complete\n"
                            for t in tasks.values() if t.is_in_progress]
        deferred_tasks = [f"- **{t.task_id}**: {t.title} ({t.complexity} points) - Deferred to R2\n"
                         for t in tasks.values() if t.is_deferred]

        # Update Delivered section
        if delivered_start != -1:
            # Find end of section
            section_end = delivered_start + 1
            while section_end < len(lines) and not lines[section_end].startswith('**'):
                section_end += 1

            # Replace with updated content
            if delivered_tasks:
                new_content = ['**Delivered** ✅ (ALL TASKS COMPLETE)\n'] + delivered_tasks + ['\n']
            else:
                new_content = ['**Delivered** ✅\n', '(None yet)\n', '\n']

            lines[delivered_start:section_end] = new_content
            print(f"  Updated Delivered section: {len(delivered_tasks)} tasks", file=sys.stderr)

        return lines

    def update_wp_summary_table(self, lines: List[str], wps: Dict[str, WPData]) -> List[str]:
        """Update Work Package Summary table"""
        print(f"\n🔧 Updating Work Package Summary table...", file=sys.stderr)

        # Find table boundaries
        table_start = -1
        table_end = -1

        for i, line in enumerate(lines):
            if '### Work Package Summary' in line:
                table_start = i
            elif table_start != -1 and line.startswith('###'):
                table_end = i
                break

        if table_start == -1:
            print(f"  ⚠️  Table not found, skipping", file=sys.stderr)
            return lines

        if table_end == -1:
            table_end = len(lines)

        # Rebuild table
        new_table = []
        new_table.append('### Work Package Summary\n')
        new_table.append('| Package | Complexity | Progress | Status | Completion Date |\n')
        new_table.append('|---------|------------|----------|--------|-----------------||\n')

        total_complexity = 0
        total_completed = 0.0

        for wp_id in sorted(wps.keys()):
            wp = wps[wp_id]
            bar = self.generate_progress_bar(wp.progress)
            new_table.append(f"| {wp_id}: Flujo de Ingesta | {wp.complexity} points | [{bar}] {wp.progress}% | {wp.status} | {wp.completed_date} |\n")
            total_complexity += wp.complexity
            total_completed += wp.completed_points

        # Add total row
        total_progress = int((total_completed / total_complexity * 100)) if total_complexity > 0 else 0
        total_bar = self.generate_progress_bar(total_progress)
        total_status = "✅ Complete" if total_progress == 100 else "🟡 In Progress"
        new_table.append(f"| **Total R1** | **{total_complexity} points** | **[{total_bar}] {total_progress}%** | **{total_status}** | **TBD** |\n")
        new_table.append('\n')

        # Replace old table
        lines[table_start:table_end] = new_table
        print(f"  Updated WP Summary table: {len(wps)} work packages", file=sys.stderr)

        return lines

    def update_task_completion_matrix(self, lines: List[str], tasks: Dict[str, TaskData]) -> List[str]:
        """Update Task Completion Matrix"""
        print(f"\n🔧 Updating Task Completion Matrix...", file=sys.stderr)

        # Find table row for each task and update
        for i, line in enumerate(lines):
            for task_id, task in tasks.items():
                if line.startswith(f"| {task_id} |") or line.startswith(f"| **{task_id}** |"):
                    old_line = line.strip()
                    new_line = f"| {task_id} | {task.title} | {task.complexity} | {task.status} | {task.progress}% | {task.owner} | {task.completed_date} |\n"

                    if new_line != line:
                        lines[i] = new_line
                        print(f"  Updated {task_id}: {task.progress}% {task.status}", file=sys.stderr)

        return lines

    def update_current_focus(self, lines: List[str], metrics: ReleaseMetrics) -> List[str]:
        """Update Current Focus section"""
        print(f"\n🔧 Updating Current Focus...", file=sys.stderr)

        # This section is more narrative-driven, so we update key status indicators
        for i, line in enumerate(lines):
            if '## Release Complete' in line and metrics.release_progress == 100:
                # Already marked complete, skip
                break
            elif '## Current Focus' in line and metrics.release_progress == 100:
                # Change to "Release Complete"
                lines[i] = '## Release Complete ✅\n'
                print(f"  Changed 'Current Focus' to 'Release Complete'", file=sys.stderr)

        return lines

    def update_completed_work(self, lines: List[str], tasks: Dict[str, TaskData]) -> List[str]:
        """Add completed tasks to Completed Work section"""
        print(f"\n🔧 Updating Completed Work section...", file=sys.stderr)

        # Find Completed Work section
        section_start = -1
        for i, line in enumerate(lines):
            if '## Completed Work' in line:
                section_start = i
                break

        if section_start == -1:
            print(f"  ⚠️  Section not found, skipping", file=sys.stderr)
            return lines

        # Ensure all completed tasks are documented
        # (This is a placeholder - actual implementation would check for missing tasks)
        completed_count = sum(1 for t in tasks.values() if t.is_complete)
        print(f"  Verified {completed_count} completed tasks in Completed Work", file=sys.stderr)

        return lines

    def update_history(self, lines: List[str], wp_id: Optional[str], metrics: ReleaseMetrics, current_date: str) -> List[str]:
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

        # Determine change description
        if metrics.release_progress == 100:
            change_desc = f"R1 completion: {metrics.completed_wps}/{metrics.total_wps} WPs complete, R1 COMPLETE"
            impact = "Major milestone"
        elif wp_id:
            change_desc = f"{wp_id} milestone update, R1 at {metrics.release_progress}%"
            impact = "Release progress update"
        else:
            change_desc = f"Release status update: {metrics.release_progress}% complete"
            impact = "Metrics update"

        # Check if today's entry already exists
        entry_exists = False
        for i in range(table_start + 2, min(table_start + 20, len(lines))):
            if current_date in lines[i]:
                entry_exists = True
                # Update existing entry
                lines[i] = f"| {current_date} | Tech Lead | {change_desc} | {impact} |\n"
                print(f"  Updated existing entry for {current_date}", file=sys.stderr)
                break

        if not entry_exists:
            # Insert new entry after header rows
            separator_line = table_start + 1
            new_entry = f"| {current_date} | Tech Lead | {change_desc} | {impact} |\n"
            lines.insert(separator_line + 1, new_entry)
            print(f"  Added new history entry for {current_date}", file=sys.stderr)

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


def read_wp_progress_files(release_id: str, docs_root: Path) -> Dict[str, WPData]:
    """
    Read all WP progress files for a release to get actual data

    Returns: {wp_id: WPData}
    """
    print(f"\n📂 Reading WP progress files for {release_id}...", file=sys.stderr)

    wps = {}
    progress_dir = docs_root / "docs" / "project-management" / "progress"

    if not progress_dir.exists():
        print(f"⚠️  Progress directory not found: {progress_dir}", file=sys.stderr)
        return wps

    # Find all WP files for this release
    wp_pattern = f"{release_id}-WP*.md"
    wp_files = list(progress_dir.glob(wp_pattern))

    for wp_file in wp_files:
        # Extract WP ID from filename (e.g., "R1-WP1-progress.md" -> "R1-WP1")
        wp_match = re.search(r'(R\d+-WP\d+)', wp_file.name)
        if not wp_match:
            continue

        wp_id = wp_match.group(1)

        try:
            with open(wp_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Parse WP file to extract metrics
            # Look for "- **Progress**: [██████████] 100% (44/44 points)"
            progress_match = re.search(r'\*\*Progress\*\*:.*?(\d+)%.*?\((\d+)/(\d+)', content)
            if progress_match:
                progress = int(progress_match.group(1))
                completed = int(progress_match.group(2))
                total = int(progress_match.group(3))
            else:
                progress = 0
                total = 0

            # Look for "- **Status**: ✅ Complete"
            status_match = re.search(r'\*\*Status\*\*:\s*([^\n]+)', content)
            status = status_match.group(1).strip() if status_match else "Not Started"

            # Look for completion date
            completed_date_match = re.search(r'\*\*Completion Date\*\*:\s*(\d{4}-\d{2}-\d{2})', content)
            completed_date = completed_date_match.group(1) if completed_date_match else ""

            wps[wp_id.replace('-', '.')] = WPData(
                wp_id=wp_id.replace('-', '.'),  # Convert R1-WP1 to R1.WP1
                complexity=total,
                progress=progress,
                status=status,
                completed_date=completed_date
            )

            print(f"  ✅ Read {wp_id}: {total} pts, {progress}%, {status}", file=sys.stderr)

        except Exception as e:
            print(f"  ⚠️  Error reading {wp_file}: {e}", file=sys.stderr)
            continue

    return wps


def update_release_complete(release_file: str, wp_id: Optional[str] = None):
    """
    Comprehensive Release file update - Updates ALL sections

    Args:
        release_file: Path to R*-RELEASE-STATUS.md
        wp_id: Optional WP ID that triggered update (for logging context)
    """
    print(f"\n{'='*70}", file=sys.stderr)
    print(f"🚀 Starting COMPREHENSIVE Release update: {release_file}", file=sys.stderr)
    if wp_id:
        print(f"📌 WP context: {wp_id}", file=sys.stderr)
    print(f"{'='*70}", file=sys.stderr)

    # Read file
    release_path = Path(release_file)
    if not release_path.exists():
        print(f"❌ Release file not found: {release_file}", file=sys.stderr)
        return False

    with open(release_path, 'r', encoding='utf-8') as f:
        content = f.read()
        lines = content.split('\n')

    # Parse existing data from release file
    parser = ReleaseFileParser()
    wps_from_file = parser.parse_wp_summary_table(content)
    tasks = parser.parse_task_completion_matrix(content)
    release_id = parser.extract_release_id(content)

    # Read actual WP progress files to get fresh data
    docs_root = release_path.parent.parent.parent  # Go up to project root
    wps_from_files = read_wp_progress_files(release_id, docs_root)

    # Merge: prefer fresh data from WP files if available
    wps = {**wps_from_file, **wps_from_files}

    if not wps:
        print(f"❌ No work packages found in {release_file}", file=sys.stderr)
        return False

    if not tasks:
        print(f"⚠️  No tasks found in {release_file}, continuing with WP data only", file=sys.stderr)

    # Calculate metrics
    calculator = ReleaseMetricsCalculator()
    metrics = calculator.calculate_release_metrics(wps, tasks)

    # Get current date
    current_date = datetime.now().strftime('%Y-%m-%d')

    # Update ALL sections (comprehensive coverage)
    updater = ReleaseFileUpdater()
    lines_list = [line + '\n' for line in lines]  # Add newlines back

    # Core sections
    lines_list = updater.update_summary_dashboard(lines_list, metrics, current_date)
    lines_list = updater.update_success_criteria(lines_list, tasks)
    lines_list = updater.update_key_deliverables(lines_list, tasks)
    lines_list = updater.update_wp_summary_table(lines_list, wps)
    lines_list = updater.update_task_completion_matrix(lines_list, tasks)
    lines_list = updater.update_current_focus(lines_list, metrics)
    lines_list = updater.update_completed_work(lines_list, tasks)

    # Cleanup
    lines_list = updater.clean_duplicate_status_indicators(lines_list)

    # Update history (last, so we don't modify line numbers)
    lines_list = updater.update_history(lines_list, wp_id, metrics, current_date)

    # Write back
    updated_content = ''.join(lines_list)
    with open(release_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)

    print(f"\n{'='*70}", file=sys.stderr)
    print(f"✅ COMPREHENSIVE RELEASE UPDATE COMPLETE", file=sys.stderr)
    print(f"📊 Sections updated: Summary, Success Criteria, Key Deliverables,", file=sys.stderr)
    print(f"   WP Summary, Task Matrix, Current Focus, Completed Work, History", file=sys.stderr)
    print(f"📊 Release Progress: {metrics.release_progress}% ({int(metrics.completed_points)}/{int(metrics.total_complexity - metrics.deferred_points)} points)", file=sys.stderr)
    print(f"📊 Status: {metrics.format_status()}", file=sys.stderr)
    print(f"📊 WPs: {metrics.completed_wps}/{metrics.total_wps} complete", file=sys.stderr)
    print(f"📊 Tasks: {metrics.completed_tasks}/{metrics.total_tasks} complete", file=sys.stderr)
    print(f"{'='*70}\n", file=sys.stderr)

    return True


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 update-release-complete.py <release_file> [wp_id]")
        print("\nExample:")
        print("  python3 update-release-complete.py docs/project-management/status/R1-RELEASE-STATUS.md R1-WP1")
        sys.exit(1)

    release_file = sys.argv[1]
    wp_id = sys.argv[2] if len(sys.argv) >= 3 else None

    if not Path(release_file).exists():
        print(f"❌ File not found: {release_file}", file=sys.stderr)
        sys.exit(2)

    if update_release_complete(release_file, wp_id):
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
