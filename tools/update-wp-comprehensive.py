#!/usr/bin/env python3
"""
update-wp-comprehensive.py - Comprehensive Work Package update script
Purpose: Update ALL sections in WP progress files (not just task matrix)
Usage: python3 update-wp-comprehensive.py <wp_file> <task_id> <status_emoji> <progress> <complexity>
"""

import sys
import re
from pathlib import Path
from typing import Dict, List, Tuple

def parse_wp_tasks(wp_file: str) -> Dict[str, Dict]:
    """Parse all tasks in WP file to get current state"""
    tasks = {}

    with open(wp_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find Task Summary table
    table_match = re.search(
        r'\| Task ID \|.*?\n\|(.*?)\n(?:\n|##)',
        content,
        re.DOTALL
    )

    if table_match:
        table_content = table_match.group(1)
        # Parse each row
        for line in table_content.split('\n'):
            if '|' in line and line.strip():
                parts = [p.strip() for p in line.split('|') if p.strip()]
                if len(parts) >= 4 and parts[0].startswith('T-'):
                    task_id = parts[0].replace('**', '').strip()
                    status = parts[2]
                    progress_match = re.search(r'(\d+)%', parts[3])
                    progress = int(progress_match.group(1)) if progress_match else 0

                    # Extract complexity from progress column (X/Y format)
                    complexity_match = re.search(r'(\d+)/(\d+)', parts[3])
                    if complexity_match:
                        completed = int(complexity_match.group(1))
                        total = int(complexity_match.group(2))
                    else:
                        # Try to find in first column or second
                        complexity_match = re.search(r'\|\s*\*\*\w+-\d+\*\*\s*\|[^|]*\|\s*(\d+)\s*\|', line)
                        total = int(complexity_match.group(1)) if complexity_match else 0
                        completed = int(total * progress / 100) if total > 0 else 0

                    tasks[task_id] = {
                        'status': status,
                        'progress': progress,
                        'complexity': total,
                        'completed': completed
                    }

    return tasks

def calculate_wp_metrics(tasks: Dict[str, Dict]) -> Dict:
    """Calculate WP-level metrics from task data"""
    total_complexity = sum(t['complexity'] for t in tasks.values())
    completed_points = sum(t['completed'] for t in tasks.values())

    completed_tasks = sum(1 for t in tasks.values() if '✅' in t['status'] or t['progress'] == 100)
    in_progress_tasks = sum(1 for t in tasks.values() if '🟡' in t['status'] and t['progress'] < 100)
    not_started_tasks = sum(1 for t in tasks.values() if '🔴' in t['status'] or t['progress'] == 0)
    deferred_tasks = sum(1 for t in tasks.values() if '🔵' in t['status'])

    total_tasks = len(tasks)
    wp_progress = int((completed_points / total_complexity * 100) if total_complexity > 0 else 0)

    return {
        'total_complexity': total_complexity,
        'completed_points': completed_points,
        'in_progress_points': sum(t['completed'] for t in tasks.values() if '🟡' in t['status']),
        'remaining_points': total_complexity - completed_points,
        'wp_progress': wp_progress,
        'completed_tasks': completed_tasks,
        'in_progress_tasks': in_progress_tasks,
        'not_started_tasks': not_started_tasks,
        'deferred_tasks': deferred_tasks,
        'total_tasks': total_tasks
    }

def generate_progress_bar(progress: int) -> str:
    """Generate progress bar [████░░░░░░] for given percentage"""
    filled = int(progress / 10)
    empty = 10 - filled
    return '█' * filled + '░' * empty

def update_summary_dashboard(lines: List[str], metrics: Dict) -> List[str]:
    """Update Summary Dashboard section"""
    progress_bar = generate_progress_bar(metrics['wp_progress'])

    for i, line in enumerate(lines):
        # Update Status line
        if line.strip().startswith('- **Status**:'):
            if metrics['completed_tasks'] == metrics['total_tasks']:
                lines[i] = '- **Status**: ✅ Complete (all tasks done)\n'
            elif metrics['in_progress_tasks'] > 0:
                lines[i] = f'- **Status**: 🟡 In Progress ({metrics["completed_tasks"]}/{metrics["total_tasks"]} tasks complete)\n'
            else:
                lines[i] = f'- **Status**: 🔴 Not Started\n'

        # Update Progress line
        elif '**Progress**:' in line and '[' in line:
            lines[i] = f'- **Progress**: [{progress_bar}] {metrics["wp_progress"]}% ({metrics["completed_points"]}/{metrics["total_complexity"]} points)\n'

        # Update Complexity line
        elif '**Complexity**:' in line and 'points' in line:
            lines[i] = f'- **Complexity**: {metrics["completed_points"]}/{metrics["total_complexity"]} points completed | {metrics["remaining_points"]} points remaining\n'

    return lines

def update_complexity_breakdown(lines: List[str], metrics: Dict) -> List[str]:
    """Update Complexity Breakdown section"""
    for i, line in enumerate(lines):
        if line.startswith('### Complexity Breakdown'):
            # Find and update the lines
            for j in range(i, min(i + 10, len(lines))):
                if '**Completed Tasks**:' in lines[j]:
                    lines[j] = f'- **Completed Tasks**: {metrics["completed_points"]} points\n'
                elif '**In Progress**:' in lines[j]:
                    lines[j] = f'- **In Progress**: {metrics["in_progress_points"]} points\n'
                elif '**Remaining Work**:' in lines[j]:
                    lines[j] = f'- **Remaining Work**: {metrics["remaining_points"]} points\n'
                elif '**Overall Progress**:' in lines[j]:
                    lines[j] = f'- **Overall Progress**: {metrics["completed_points"]}/{metrics["total_complexity"]} points ({metrics["wp_progress"]}%)\n'
            break

    return lines

def update_comprehensive(wp_file: str, task_id: str, status_emoji: str, progress: int, complexity: int):
    """Comprehensive WP file update"""

    # Read file
    with open(wp_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Parse current tasks
    tasks = parse_wp_tasks(wp_file)

    # Update task in dict
    if task_id not in tasks:
        print(f"⚠️  Task {task_id} not found in WP file", file=sys.stderr)
        tasks[task_id] = {}

    tasks[task_id]['status'] = status_emoji
    tasks[task_id]['progress'] = progress
    tasks[task_id]['complexity'] = complexity
    tasks[task_id]['completed'] = int(complexity * progress / 100)

    # Calculate WP metrics
    metrics = calculate_wp_metrics(tasks)

    # Update all sections
    lines = update_summary_dashboard(lines, metrics)
    lines = update_complexity_breakdown(lines, metrics)

    # Write back
    with open(wp_file, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print(f"✅ Updated comprehensive WP metrics", file=sys.stderr)
    print(f"📊 WP Progress: {metrics['wp_progress']}% ({metrics['completed_points']}/{metrics['total_complexity']} points)", file=sys.stderr)
    return True

def main():
    if len(sys.argv) != 6:
        print("Usage: python3 update-wp-comprehensive.py <wp_file> <task_id> <status_emoji> <progress> <complexity>")
        sys.exit(1)

    wp_file = sys.argv[1]
    task_id = sys.argv[2]
    status_emoji = sys.argv[3]
    progress = int(sys.argv[4])
    complexity = int(sys.argv[5])

    if not Path(wp_file).exists():
        print(f"❌ File not found: {wp_file}", file=sys.stderr)
        sys.exit(2)

    if update_comprehensive(wp_file, task_id, status_emoji, progress, complexity):
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
