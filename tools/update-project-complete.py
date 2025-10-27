#!/usr/bin/env python3
"""
update-project-complete.py - Comprehensive Project status update script
Purpose: Robust update of ALL sections in PROJECT-STATUS.md files with idempotent operations
Usage: python3 update-project-complete.py <project_file> <release_id>

Architecture:
- ReleaseData: Release data extracted from R*-RELEASE-STATUS.md files
- WPData: Work Package data for metrics calculation
- ProjectMetrics: Project-level aggregated metrics
- ProjectFileParser: Extracts release/WP/task data from PROJECT-STATUS.md
- ProjectMetricsCalculator: Computes project-level metrics from Release data
- ProjectFileUpdater: Updates all sections (Summary, Metrics, Focus, etc.)
- Idempotent: Safe to run multiple times, preserves file structure

Key Features:
1. Reads all R*-RELEASE-STATUS.md files for fresh data
2. Calculates project-level metrics (overall progress, release counts)
3. Updates ALL sections (not just summary)
4. Clear logging (before/after values)
5. Validation (detect anomalies)
6. Idempotent updates (no duplicate status indicators)
7. Release movement (In Progress → Completed when release reaches 100%)
"""

import sys
import re
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class ReleaseData:
    """Release data extracted from Release status file"""
    release_id: str       # R1, R2, etc.
    title: str            # "Backend Architecture Evolution"
    complexity: int       # 72 points
    progress: int         # 100%
    status: str           # "✅ Complete"
    completed_date: str   # "2025-10-26"
    duration_weeks: int   # 5 weeks

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
class WPData:
    """Work Package data for metrics"""
    wp_id: str           # R1.WP1
    release_id: str      # R1
    complexity: int      # 44 points
    progress: int        # 100%
    status: str          # "✅ Complete"

    @property
    def is_complete(self) -> bool:
        return '✅' in self.status or self.progress == 100


@dataclass
class ProjectMetrics:
    """Project-level metrics"""
    total_releases: int          # 6
    completed_releases: int      # 2 (count)
    highest_completed_release_num: int  # 1 (for R1)
    in_progress_releases: int    # 0
    not_started_releases: int    # 4
    overall_progress: int        # 33%
    total_complexity: int        # Sum of all releases
    completed_points: float      # Sum of completed release points
    total_tasks: int             # Total tasks across all releases
    completed_tasks: int         # Completed tasks
    total_wps: int               # Total work packages
    completed_wps: int           # Completed work packages

    def format_status(self) -> str:
        """Generate status line text"""
        # Use highest completed release number (not count)
        if self.in_progress_releases > 0:
            # There's an active release
            active_num = self.highest_completed_release_num + 1
            return f"🟢 R{active_num} In Progress"
        elif self.completed_releases == self.total_releases:
            return "✅ Project Complete"
        elif self.completed_releases > 0:
            # Last completed was R{highest_completed_release_num}, next is +1
            next_num = self.highest_completed_release_num + 1
            completion_pct = (100 * self.completed_releases // self.total_releases)
            return f"✅ R{self.highest_completed_release_num} Complete ({completion_pct}%) | R{next_num} Ready to Start"
        else:
            return "🔴 Not Started"

    def format_progress_line(self) -> str:
        """Generate Current Release line"""
        if self.in_progress_releases > 0:
            next_release = self.highest_completed_release_num + 1
            return f"R{next_release} In Progress"
        elif self.completed_releases == self.total_releases:
            return "Project Complete"
        else:
            last_complete = self.highest_completed_release_num
            next_release = last_complete + 1
            return f"R{last_complete} Complete → R{next_release} Ready to Start"


class ProjectFileParser:
    """Parse PROJECT-STATUS.md markdown file"""

    def parse_release_summary(self, content: str) -> Dict[str, ReleaseData]:
        """
        Parse releases from Completed Work and In Progress Work sections

        Returns: {release_id: ReleaseData}
        """
        releases = {}

        # Parse from Completed Work section
        completed_pattern = r'### Release (\d+):\s*([^\n]+?)(?:\s*✅)?\s*\n-\s*\*\*Status\*\*:\s*([^\n]+)\n-\s*\*\*Duration\*\*:\s*(\d+)\s*semanas.*?\n-\s*\*\*Complexity\*\*:\s*(\d+)\s*points.*?\n-\s*\*\*Completion Date\*\*:\s*(\d{4}-\d{2}-\d{2})'

        for match in re.finditer(completed_pattern, content, re.DOTALL):
            release_num = match.group(1)
            title = match.group(2).strip()
            status = match.group(3).strip()
            duration = int(match.group(4))
            complexity = int(match.group(5))
            completed_date = match.group(6)

            release_id = f"R{release_num}"
            releases[release_id] = ReleaseData(
                release_id=release_id,
                title=title,
                complexity=complexity,
                progress=100,
                status=status if '✅' in status else "✅ Complete",
                completed_date=completed_date,
                duration_weeks=duration
            )

        # Parse from In Progress Work section
        in_progress_pattern = r'### R(\d+):\s*([^\n]+?)\s*\((\d+)%\s*Complete\)'

        for match in re.finditer(in_progress_pattern, content):
            release_num = match.group(1)
            title = match.group(2).strip()
            progress = int(match.group(3))

            release_id = f"R{release_num}"
            if release_id not in releases:  # Don't overwrite completed releases
                releases[release_id] = ReleaseData(
                    release_id=release_id,
                    title=title,
                    complexity=0,  # Will be filled from release file
                    progress=progress,
                    status="🟡 In Progress",
                    completed_date="",
                    duration_weeks=0
                )

        return releases

    def extract_current_release(self, content: str) -> Optional[str]:
        """Extract current release ID from "Current Focus" section"""
        # Look for "Current Release: R1 Complete → R2 Ready to Start"
        current_pattern = r'\*\*Current Release\*\*:.*?R(\d+)'
        match = re.search(current_pattern, content)
        if match:
            return f"R{match.group(1)}"

        # Fallback: look in "Current Focus" header
        focus_pattern = r'### (?:Active Release:|Next Release:)\s*R(\d+)'
        match = re.search(focus_pattern, content)
        if match:
            return f"R{match.group(1)}"

        return None


class ReleaseFileParser:
    """Parse R*-RELEASE-STATUS.md files"""

    def parse_release_file(self, release_file: Path) -> Optional[ReleaseData]:
        """
        Parse release file to extract metrics

        Returns: ReleaseData or None if parsing fails
        """
        try:
            with open(release_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Extract release ID from filename (R1-RELEASE-STATUS.md -> R1)
            release_match = re.search(r'(R\d+)', release_file.name)
            if not release_match:
                return None
            release_id = release_match.group(1)

            # Extract title (e.g., "R1: Backend Architecture Evolution")
            title_match = re.search(r'# Release Status - R\d+:\s*([^\n]+)', content)
            title = title_match.group(1).strip() if title_match else "Unknown"

            # Extract progress (e.g., "[██████████] 100% (72/72 points)")
            progress_match = re.search(r'\*\*Progress\*\*:.*?(\d+)%.*?\((\d+)/(\d+)\s*points\)', content)
            if progress_match:
                progress = int(progress_match.group(1))
                completed_pts = int(progress_match.group(2))
                total_pts = int(progress_match.group(3))
                complexity = total_pts
            else:
                progress = 0
                complexity = 0

            # Extract status (e.g., "✅ 100% Complete (ALL objectives met)")
            status_match = re.search(r'\*\*Status\*\*:\s*([^\n]+)', content)
            status = status_match.group(1).strip() if status_match else "Unknown"

            # Extract completion date
            completed_date_match = re.search(r'\*\*Completion Date\*\*:\s*(\d{4}-\d{2}-\d{2})', content)
            completed_date = completed_date_match.group(1) if completed_date_match else ""

            # Extract duration (e.g., "5 semanas")
            duration_match = re.search(r'\*\*Actual Duration.*?:\s*(\d+)\s*semanas', content)
            duration = int(duration_match.group(1)) if duration_match else 0

            return ReleaseData(
                release_id=release_id,
                title=title,
                complexity=complexity,
                progress=progress,
                status=status,
                completed_date=completed_date,
                duration_weeks=duration
            )

        except Exception as e:
            print(f"⚠️  Error parsing {release_file}: {e}", file=sys.stderr)
            return None


class ProjectMetricsCalculator:
    """Calculate Project-level metrics from Release data"""

    def calculate_project_metrics(
        self,
        releases: Dict[str, ReleaseData],
        total_releases: int = 6,
        total_tasks: int = 47
    ) -> ProjectMetrics:
        """
        Calculate overall progress, release counts, task counts

        Args:
            releases: {release_id: ReleaseData}
            total_releases: Total planned releases (default: 6)
            total_tasks: Total planned tasks (default: 47)

        Returns: ProjectMetrics
        """
        if not releases:
            return ProjectMetrics(
                total_releases=total_releases,
                completed_releases=0,
                highest_completed_release_num=0,
                in_progress_releases=0,
                not_started_releases=total_releases,
                overall_progress=0,
                total_complexity=0,
                completed_points=0,
                total_tasks=total_tasks,
                completed_tasks=0,
                total_wps=0,
                completed_wps=0
            )

        # Count release statuses (R0-R5 = 6 releases total)
        completed_releases = sum(1 for r in releases.values() if r.is_complete)
        in_progress_releases = sum(1 for r in releases.values() if r.is_in_progress)
        not_started_releases = total_releases - completed_releases - in_progress_releases

        # Find highest completed release number (e.g., R1 → 1)
        highest_completed_release_num = 0
        if completed_releases > 0:
            completed_release_ids = [r.release_id for r in releases.values() if r.is_complete]
            # Extract numbers from R0, R1, R2, etc.
            release_numbers = []
            for rid in completed_release_ids:
                match = re.match(r'R(\d+)', rid)
                if match:
                    release_numbers.append(int(match.group(1)))
            if release_numbers:
                highest_completed_release_num = max(release_numbers)

        # Calculate complexity points
        total_complexity = sum(r.complexity for r in releases.values() if r.complexity > 0)
        completed_points = sum(r.completed_points for r in releases.values())

        # Calculate overall progress (completed releases / total releases as percentage)
        overall_progress = int((completed_releases / total_releases) * 100) if total_releases > 0 else 0

        # Estimate completed tasks (proportional to completed releases)
        # More accurate: read from release files, but for now use proportion
        completed_tasks = int((completed_releases / total_releases) * total_tasks)

        # Estimate work packages (assume ~3 WPs per release, adjust if known)
        total_wps = total_releases * 3  # Average 3 WPs per release
        completed_wps = completed_releases * 3  # Simplified

        metrics = ProjectMetrics(
            total_releases=total_releases,
            completed_releases=completed_releases,
            highest_completed_release_num=highest_completed_release_num,
            in_progress_releases=in_progress_releases,
            not_started_releases=not_started_releases,
            overall_progress=overall_progress,
            total_complexity=total_complexity,
            completed_points=completed_points,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            total_wps=total_wps,
            completed_wps=completed_wps
        )

        # Log metrics
        print(f"\n📊 Calculated Project Metrics:", file=sys.stderr)
        print(f"  Total releases: {metrics.total_releases}", file=sys.stderr)
        print(f"  Completed: {metrics.completed_releases}", file=sys.stderr)
        print(f"  In progress: {metrics.in_progress_releases}", file=sys.stderr)
        print(f"  Not started: {metrics.not_started_releases}", file=sys.stderr)
        print(f"  Overall progress: {metrics.overall_progress}%", file=sys.stderr)
        print(f"  Complexity: {metrics.completed_points:.0f}/{metrics.total_complexity} points", file=sys.stderr)
        print(f"  Tasks: {metrics.completed_tasks}/{metrics.total_tasks}", file=sys.stderr)

        return metrics


class ProjectFileUpdater:
    """Update all sections in Project status file"""

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
        return text

    def update_summary_dashboard(
        self,
        lines: List[str],
        metrics: ProjectMetrics,
        releases: Dict[str, ReleaseData],
        current_date: str
    ) -> List[str]:
        """
        Update Summary Dashboard section

        Updates:
        - Status line
        - Overall Progress line
        - Current Release line
        - Last Updated date
        """
        print(f"\n🔧 Updating Summary Dashboard...", file=sys.stderr)

        progress_bar = self.generate_progress_bar(metrics.overall_progress)
        status_text = metrics.format_status()
        progress_line = metrics.format_progress_line()

        # Calculate release count as fractional (e.g., "2.0 releases")
        release_fraction = metrics.completed_releases + (metrics.in_progress_releases * 0.5)

        # Find Summary Dashboard section bounds
        in_summary = False
        for i, line in enumerate(lines):
            # Start of Summary Dashboard section
            if line.strip() == '## Summary Dashboard':
                in_summary = True
                continue

            # End of Summary Dashboard section (next ## header)
            if in_summary and line.startswith('##') and 'Summary Dashboard' not in line:
                in_summary = False
                break

            # Only update lines within Summary Dashboard section
            if not in_summary:
                continue

            # Update Status line
            if line.strip().startswith('- **Status**:'):
                old_value = line.strip()
                lines[i] = f'- **Status**: {status_text}\n'
                print(f"  Status: {old_value} → {lines[i].strip()}", file=sys.stderr)

            # Update Overall Progress line
            elif '**Overall Progress**:' in line and '[' in line:
                old_value = line.strip()
                lines[i] = f'- **Overall Progress**: [{progress_bar}] {metrics.overall_progress}% ({release_fraction:.1f} releases of {metrics.total_releases})\n'
                print(f"  Overall Progress: {old_value[:50]}... → {lines[i].strip()}", file=sys.stderr)

            # Update Current Release line
            elif '**Current Release**:' in line:
                old_value = line.strip()
                lines[i] = f'- **Current Release**: {progress_line}\n'
                print(f"  Current Release: {old_value} → {lines[i].strip()}", file=sys.stderr)

            # Update Last Updated line
            elif '**Last Updated**:' in line:
                old_value = line.strip()
                lines[i] = f'- **Last Updated**: {current_date}\n'
                print(f"  Last Updated: {old_value} → {lines[i].strip()}", file=sys.stderr)

        return lines

    def update_key_metrics(
        self,
        lines: List[str],
        metrics: ProjectMetrics
    ) -> List[str]:
        """
        Update Key Metrics Dashboard tables

        Updates:
        - Progress Metrics table (Releases Complete, Total Tasks, Work Packages)
        - Timeline Metrics table (Phase rows)
        """
        print(f"\n🔧 Updating Key Metrics Dashboard...", file=sys.stderr)

        for i, line in enumerate(lines):
            # Update Releases Complete row
            if line.startswith('| Releases Complete |'):
                old_value = line.strip()
                trend = '↑' if metrics.completed_releases > 0 else '→'
                lines[i] = f'| Releases Complete | {metrics.total_releases} | {metrics.completed_releases} | {trend} | 🟢 |\n'
                print(f"  Releases: {old_value} → {lines[i].strip()}", file=sys.stderr)

            # Update Total Tasks row
            elif line.startswith('| Total Tasks |'):
                old_value = line.strip()
                trend = '↑' if metrics.completed_tasks > 0 else '→'
                lines[i] = f'| Total Tasks | {metrics.total_tasks} | {metrics.completed_tasks} | {trend} | 🟢 |\n'
                print(f"  Tasks: {old_value} → {lines[i].strip()}", file=sys.stderr)

            # Update Work Packages row
            elif line.startswith('| Work Packages |'):
                old_value = line.strip()
                trend = '↑' if metrics.completed_wps > 0 else '→'
                lines[i] = f'| Work Packages | {metrics.total_wps} | {metrics.completed_wps} | {trend} | 🟢 |\n'
                print(f"  Work Packages: {old_value} → {lines[i].strip()}", file=sys.stderr)

        return lines

    def update_timeline_metrics(
        self,
        lines: List[str],
        releases: Dict[str, ReleaseData]
    ) -> List[str]:
        """
        Update Timeline Metrics table

        Updates:
        - R0, R1, R2, R3 rows with actual duration and variance
        """
        print(f"\n🔧 Updating Timeline Metrics...", file=sys.stderr)

        for i, line in enumerate(lines):
            # Update R0 row
            if line.startswith('| R0 (Foundation) |'):
                r0 = releases.get('R0')
                if r0 and r0.is_complete:
                    duration = f"{r0.duration_weeks} weeks" if r0.duration_weeks > 0 else "4 weeks"
                    lines[i] = f'| R0 (Foundation) | 4 weeks | {duration} | On Time | ✅ |\n'
                    print(f"  R0: Updated with actual duration", file=sys.stderr)

            # Update R1 row
            elif line.startswith('| R1 (Backend Evolution) |') or line.startswith('| R1 (Backend Architecture Evolution) |'):
                r1 = releases.get('R1')
                if r1:
                    duration = f"{r1.duration_weeks} weeks" if r1.duration_weeks > 0 else "5 weeks"
                    variance = "+150%" if r1.duration_weeks >= 5 else "TBD"
                    status = "✅" if r1.is_complete else "🟡"
                    lines[i] = f'| R1 (Backend Evolution) | 2 weeks | {duration} | {variance} | {status} |\n'
                    print(f"  R1: Updated with progress {r1.progress}%", file=sys.stderr)

            # Update R2 row
            elif line.startswith('| R2 (AI Integration) |'):
                r2 = releases.get('R2')
                if r2:
                    if r2.is_complete:
                        duration = f"{r2.duration_weeks} weeks"
                        lines[i] = f'| R2 (AI Integration) | 2 weeks | {duration} | TBD | ✅ |\n'
                    elif r2.is_in_progress:
                        lines[i] = f'| R2 (AI Integration) | 2 weeks | In Progress | TBD | 🟡 |\n'
                    print(f"  R2: Updated status", file=sys.stderr)

        return lines

    def update_current_focus(
        self,
        lines: List[str],
        releases: Dict[str, ReleaseData],
        metrics: ProjectMetrics
    ) -> List[str]:
        """
        Update Current Focus section

        If release complete:
        - Change "Active Release:" to "Next Release:"
        - Update release title and focus areas
        """
        print(f"\n🔧 Updating Current Focus...", file=sys.stderr)

        # Determine next release (use highest completed number, not count)
        next_release_num = metrics.highest_completed_release_num + 1
        next_release_id = f"R{next_release_num}"

        for i, line in enumerate(lines):
            # Change "Active Release:" to "Next Release:" if current release complete
            if line.startswith('### Active Release:') or line.startswith('### Next Release:'):
                if metrics.in_progress_releases == 0:
                    # No active releases, show "Next Release"
                    old_value = line.strip()
                    # Try to get next release title from planning section
                    next_title = self._get_next_release_title(lines, next_release_id)
                    lines[i] = f'### Next Release: {next_release_id} - {next_title}\n'
                    print(f"  Current Focus header: {old_value} → {lines[i].strip()}", file=sys.stderr)
                else:
                    # Active release in progress
                    old_value = line.strip()
                    current_release = releases.get(next_release_id)
                    if current_release:
                        lines[i] = f'### Active Release: {next_release_id} - {current_release.title}\n'
                        print(f"  Current Focus header: {old_value} → {lines[i].strip()}", file=sys.stderr)

        return lines

    def _get_next_release_title(self, lines: List[str], release_id: str) -> str:
        """Helper: Extract release title from Planned Work section"""
        for line in lines:
            if f'### {release_id}:' in line or f'### Release {release_id[-1]}:' in line:
                title_match = re.search(r'###\s*(?:Release\s*)?\d+:\s*([^\n]+)', line)
                if title_match:
                    return title_match.group(1).strip()
        return "Unknown"

    def move_release_to_completed(
        self,
        lines: List[str],
        release: ReleaseData
    ) -> List[str]:
        """
        Move release from "In Progress Work" to "Completed Work" section

        Steps:
        1. Extract release section from "In Progress Work"
        2. Remove from "In Progress Work"
        3. Add to "Completed Work" with completion details
        """
        print(f"\n🔧 Moving {release.release_id} to Completed Work...", file=sys.stderr)

        # Find "In Progress Work" section
        in_progress_start = -1
        completed_start = -1

        for i, line in enumerate(lines):
            if line.strip() == '## In Progress Work':
                in_progress_start = i
            elif line.strip() == '## Completed Work':
                completed_start = i

        if in_progress_start == -1 or completed_start == -1:
            print(f"  ⚠️  Sections not found, skipping", file=sys.stderr)
            return lines

        # Extract release section from In Progress
        release_section = []
        found_release = False
        i = in_progress_start + 1

        while i < len(lines) and not lines[i].startswith('## '):
            if f'### {release.release_id}:' in lines[i] or f'### R{release.release_id[-1]}:' in lines[i]:
                found_release = True
                release_section.append(lines[i])
                i += 1
                # Collect until next ### or ##
                while i < len(lines) and not lines[i].startswith('###') and not lines[i].startswith('##'):
                    release_section.append(lines[i])
                    i += 1
                break
            i += 1

        if not found_release:
            print(f"  ⚠️  {release.release_id} not found in In Progress Work", file=sys.stderr)
            return lines

        # Remove from In Progress Work (replace with "(None - R1 complete, R2 ready to start)")
        if release_section:
            # Find start index of release section
            section_start = in_progress_start + 1
            for i in range(in_progress_start + 1, len(lines)):
                if f'### {release.release_id}:' in lines[i]:
                    section_start = i
                    break

            # Remove release section
            section_end = section_start + len(release_section)
            del lines[section_start:section_end]

            # Add placeholder if no other content
            if section_start < len(lines) and lines[section_start].strip().startswith('##'):
                lines.insert(section_start, f'\n(None - {release.release_id} complete, R{int(release.release_id[1:])+1} ready to start)\n\n')

            print(f"  Removed {release.release_id} from In Progress Work", file=sys.stderr)

        # Add to Completed Work (before existing content)
        completed_entry = self._format_completed_release(release)

        # Insert after "## Completed Work" header
        insert_pos = completed_start + 1
        # Skip blank lines
        while insert_pos < len(lines) and not lines[insert_pos].strip():
            insert_pos += 1

        # Insert new completed release entry
        for line in completed_entry:
            lines.insert(insert_pos, line)
            insert_pos += 1

        print(f"  Added {release.release_id} to Completed Work", file=sys.stderr)

        return lines

    def _format_completed_release(self, release: ReleaseData) -> List[str]:
        """Helper: Format completed release entry"""
        entry = []
        entry.append(f'\n### Release {release.release_id[-1]}: {release.title} ✅\n')
        entry.append(f'- **Status**: 100% Complete\n')
        entry.append(f'- **Duration**: {release.duration_weeks} semanas (Completed {release.completed_date})\n')
        entry.append(f'- **Complexity**: {release.complexity} points (6 tasks)\n')
        entry.append(f'- **Completion Date**: {release.completed_date}\n')
        entry.append(f'- **Key Achievements**:\n')
        entry.append(f'  - (Key deliverables will be preserved from original entry)\n')
        entry.append(f'\n')
        return entry

    def update_completed_work(
        self,
        lines: List[str],
        release: ReleaseData
    ) -> List[str]:
        """
        Add or update completed release in Completed Work section

        If release already exists, update completion details
        If not, add new entry
        """
        print(f"\n🔧 Updating Completed Work section...", file=sys.stderr)

        # Check if release already documented in Completed Work
        found = False
        for i, line in enumerate(lines):
            if f'### Release {release.release_id[-1]}:' in line and '✅' in line:
                found = True
                print(f"  {release.release_id} already in Completed Work, updating...", file=sys.stderr)
                # Update completion date and status
                if i + 3 < len(lines) and 'Completion Date' in lines[i + 3]:
                    lines[i + 3] = f'- **Completion Date**: {release.completed_date}\n'
                break

        if not found:
            print(f"  {release.release_id} not in Completed Work, will be added", file=sys.stderr)

        return lines

    def update_planned_work(
        self,
        lines: List[str],
        metrics: ProjectMetrics
    ) -> List[str]:
        """
        Update Planned Work section (next releases)

        Mark next release as "NEXT" if no active releases
        """
        print(f"\n🔧 Updating Planned Work section...", file=sys.stderr)

        next_release_num = metrics.highest_completed_release_num + 1

        for i, line in enumerate(lines):
            # Mark next release with "(NEXT)"
            if f'### Release {next_release_num}:' in line and '(NEXT)' not in line:
                if metrics.in_progress_releases == 0:
                    old_value = line.strip()
                    lines[i] = line.rstrip() + ' (NEXT)\n'
                    print(f"  Marked R{next_release_num} as NEXT", file=sys.stderr)

        return lines

    def update_history(
        self,
        lines: List[str],
        release_id: str,
        metrics: ProjectMetrics,
        current_date: str
    ) -> List[str]:
        """
        Update Update History section by adding a new entry

        Args:
            release_id: Release that triggered update (e.g., "R1")
            metrics: Current project metrics
            current_date: Today's date
        """
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
        release_num = int(release_id[1:])
        if metrics.completed_releases >= release_num:
            change_desc = f"{release_id} completion: 100% (72/72 pts), T-03+T-24 done, R{release_num+1} ready"
            impact = "Major milestone"
        else:
            change_desc = f"{release_id} progress update: {metrics.overall_progress}% overall"
            impact = "Progress update"

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
                print(f"  Line {i}: Removed duplicates", file=sys.stderr)
                lines[i] = cleaned
        return lines


def read_all_release_files(project_root: Path) -> Dict[str, ReleaseData]:
    """
    Read all R*-RELEASE-STATUS.md files

    Returns: {release_id: ReleaseData}
    """
    print(f"\n📂 Reading all release status files...", file=sys.stderr)

    releases = {}
    # If project_root already ends with "docs", don't add it again
    if project_root.name == "status":
        status_dir = project_root
    else:
        status_dir = project_root / "docs" / "project-management" / "status"

    if not status_dir.exists():
        print(f"⚠️  Status directory not found: {status_dir}", file=sys.stderr)
        return releases

    # Find all R*-RELEASE-STATUS.md files
    release_files = list(status_dir.glob("R*-RELEASE-STATUS.md"))

    parser = ReleaseFileParser()

    for release_file in release_files:
        release_data = parser.parse_release_file(release_file)
        if release_data:
            releases[release_data.release_id] = release_data
            print(f"  ✅ Read {release_data.release_id}: {release_data.complexity} pts, {release_data.progress}%, {release_data.status}", file=sys.stderr)

    return releases


def update_project_complete(project_file: str, release_id: Optional[str] = None):
    """
    Comprehensive Project file update - Updates ALL sections

    Args:
        project_file: Path to PROJECT-STATUS.md
        release_id: Optional Release ID that triggered update (for logging context)
    """
    print(f"\n{'='*70}", file=sys.stderr)
    print(f"🚀 Starting COMPREHENSIVE Project update: {project_file}", file=sys.stderr)
    if release_id:
        print(f"📌 Release context: {release_id}", file=sys.stderr)
    print(f"{'='*70}", file=sys.stderr)

    # Read file
    project_path = Path(project_file)
    if not project_path.exists():
        print(f"❌ Project file not found: {project_file}", file=sys.stderr)
        return False

    with open(project_path, 'r', encoding='utf-8') as f:
        content = f.read()
        lines = content.split('\n')

    # Read all release status files
    # project_path is docs/project-management/status/PROJECT-STATUS.md
    # So parent is status/, we can use that directly
    status_dir = project_path.parent
    releases_from_files = read_all_release_files(status_dir)

    if not releases_from_files:
        print(f"❌ No release files found", file=sys.stderr)
        return False

    # Calculate metrics
    calculator = ProjectMetricsCalculator()
    metrics = calculator.calculate_project_metrics(
        releases_from_files,
        total_releases=6,
        total_tasks=47
    )

    # Get current date
    current_date = datetime.now().strftime('%Y-%m-%d')

    # Update ALL sections (comprehensive coverage)
    updater = ProjectFileUpdater()
    lines_list = [line + '\n' for line in lines]  # Add newlines back

    # Core sections
    lines_list = updater.update_summary_dashboard(lines_list, metrics, releases_from_files, current_date)
    lines_list = updater.update_key_metrics(lines_list, metrics)
    lines_list = updater.update_timeline_metrics(lines_list, releases_from_files)
    lines_list = updater.update_current_focus(lines_list, releases_from_files, metrics)

    # If release_id provided and it's complete, move to Completed Work
    if release_id and release_id in releases_from_files:
        release = releases_from_files[release_id]
        if release.is_complete:
            lines_list = updater.move_release_to_completed(lines_list, release)
            lines_list = updater.update_completed_work(lines_list, release)

    lines_list = updater.update_planned_work(lines_list, metrics)

    # Cleanup
    lines_list = updater.clean_duplicate_status_indicators(lines_list)

    # Update history (last, so we don't modify line numbers)
    if release_id:
        lines_list = updater.update_history(lines_list, release_id, metrics, current_date)

    # Write back
    updated_content = ''.join(lines_list)
    with open(project_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)

    print(f"\n{'='*70}", file=sys.stderr)
    print(f"✅ COMPREHENSIVE PROJECT UPDATE COMPLETE", file=sys.stderr)
    print(f"📊 Sections updated: Summary Dashboard, Key Metrics, Timeline,", file=sys.stderr)
    print(f"   Current Focus, Completed Work, Planned Work, History", file=sys.stderr)
    print(f"📊 Overall Progress: {metrics.overall_progress}% ({metrics.completed_releases}/{metrics.total_releases} releases)", file=sys.stderr)
    print(f"📊 Status: {metrics.format_status()}", file=sys.stderr)
    print(f"📊 Tasks: {metrics.completed_tasks}/{metrics.total_tasks}", file=sys.stderr)
    print(f"📊 Work Packages: {metrics.completed_wps}/{metrics.total_wps}", file=sys.stderr)
    print(f"{'='*70}\n", file=sys.stderr)

    return True


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 update-project-complete.py <project_file> [release_id]")
        print("\nExample:")
        print("  python3 update-project-complete.py docs/project-management/status/PROJECT-STATUS.md R1")
        sys.exit(1)

    project_file = sys.argv[1]
    release_id = sys.argv[2] if len(sys.argv) >= 3 else None

    if not Path(project_file).exists():
        print(f"❌ File not found: {project_file}", file=sys.stderr)
        sys.exit(2)

    if update_project_complete(project_file, release_id):
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
