#!/bin/bash

#==============================================================================
# FORENSIC ANALYSIS SCRIPT: QA CLI Multiple Executions with Timeout Protection
# Purpose: Capture systematic evidence of RF-003 issues before implementing fixes
# Target: 10 consecutive executions with detailed logging and timeout protection
#==============================================================================

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="/mnt/d/DELL_/Documents/GitHub/AI-Doc-Editor"
LOG_DIR="$SCRIPT_DIR/qa-analysis-logs/issues-remediation/pre-fix-analysis"
TOTAL_EXECUTIONS=10
BASE_TIMEOUT=44  # 35s average + 25% protection
ENVIRONMENT_TIMEOUT=32  # 25s average + 25%
ESCALATION_TIMEOUT=66   # +50% for failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize results tracking
declare -a execution_times
declare -a detection_results
declare -a timeout_events
start_time=$(date +%s)

echo -e "${BLUE}=== FORENSIC ANALYSIS: QA CLI Environment Detection Issues ===${NC}"
echo "Date: $(date -Iseconds)"
echo "Target: RF-003.1, RF-003.2, RF-003.3"
echo "Executions: $TOTAL_EXECUTIONS"
echo "Base timeout: ${BASE_TIMEOUT}s (+25% protection)"
echo "Log directory: $LOG_DIR"
echo ""

# Change to project directory
cd "$SCRIPT_DIR"

# Function to log with timestamp
log_with_timestamp() {
    echo "[$(date -Iseconds)] $1"
}

# Function to execute QA CLI with timeout protection
execute_qa_cli_with_timeout() {
    local execution_num=$1
    local timeout_value=$2
    local log_file="$LOG_DIR/execution-sequence-$(printf "%02d" $execution_num).log"
    
    log_with_timestamp "Starting execution #$execution_num (timeout: ${timeout_value}s)"
    
    # Create execution header
    cat > "$log_file" << EOF
=== FORENSIC EXECUTION #$execution_num ===
Date: $(date -Iseconds)
Timeout: ${timeout_value}s
PWD: $(pwd)
Node version: $(node --version)
Yarn version: $(yarn --version)

EOF
    
    # Record pre-execution state
    echo "## PRE-EXECUTION STATE" >> "$log_file"
    echo "Cache directory: $(ls -la node_modules/.cache/ 2>/dev/null | wc -l) files" >> "$log_file"
    echo "Temp files: $(ls -la /tmp/qa-* 2>/dev/null | wc -l) files" >> "$log_file"
    echo "" >> "$log_file"
    
    # Execute with timeout protection
    local exec_start=$(date +%s)
    local timeout_occurred=0
    local exit_code=0
    
    # Run the QA CLI command with timeout
    echo "## QA CLI EXECUTION" >> "$log_file"
    if timeout ${timeout_value}s yarn run cmd qa --dimension format >> "$log_file" 2>&1; then
        log_with_timestamp "✅ Execution #$execution_num completed successfully"
    else
        exit_code=$?
        if [ $exit_code -eq 124 ]; then
            timeout_occurred=1
            log_with_timestamp "⏰ Execution #$execution_num TIMED OUT after ${timeout_value}s"
            echo "## TIMEOUT EVENT DETECTED" >> "$log_file"
            echo "Timeout after: ${timeout_value}s" >> "$log_file"
            timeout_events+=("Execution #$execution_num: timeout after ${timeout_value}s")
        else
            log_with_timestamp "❌ Execution #$execution_num FAILED (exit code: $exit_code)"
            echo "## EXECUTION FAILED" >> "$log_file"
            echo "Exit code: $exit_code" >> "$log_file"
        fi
    fi
    
    local exec_end=$(date +%s)
    local exec_duration=$((exec_end - exec_start))
    execution_times+=($exec_duration)
    
    # Record post-execution state
    echo "" >> "$log_file"
    echo "## POST-EXECUTION STATE" >> "$log_file"
    echo "Execution duration: ${exec_duration}s" >> "$log_file"
    echo "Timeout occurred: $timeout_occurred" >> "$log_file"
    echo "Exit code: $exit_code" >> "$log_file"
    
    # Extract tool detection results using grep
    echo "" >> "$log_file"
    echo "## TOOL DETECTION RESULTS" >> "$log_file"
    
    # Look for megalinter and eslint detection in the log
    if grep -q "megalinter:" "$log_file"; then
        megalinter_status=$(grep "megalinter:" "$log_file" | tail -1)
        echo "MegaLinter: $megalinter_status" >> "$log_file"
    else
        echo "MegaLinter: not detected in logs" >> "$log_file"
    fi
    
    if grep -q "eslint:" "$log_file"; then
        eslint_status=$(grep "eslint:" "$log_file" | tail -1)  
        echo "ESLint: $eslint_status" >> "$log_file"
    else
        echo "ESLint: not detected in logs" >> "$log_file"
    fi
    
    # Store detection pattern for analysis
    local pattern="unknown"
    if grep -q "megalinter.*not available" "$log_file" && grep -q "eslint.*not available" "$log_file"; then
        pattern="both_unavailable"
    elif grep -q "megalinter.*[0-9]" "$log_file" && grep -q "eslint.*[0-9]" "$log_file"; then
        pattern="both_available"
    else
        pattern="mixed"
    fi
    
    detection_results+=("$execution_num:$pattern:${exec_duration}s")
    
    echo "Detection pattern: $pattern" >> "$log_file"
    echo "Analysis complete for execution #$execution_num" >> "$log_file"
    
    # Return timeout status for escalation logic
    return $timeout_occurred
}

# Function to analyze detection patterns
analyze_detection_patterns() {
    local pattern_file="$LOG_DIR/detection-method-comparison.log"
    
    cat > "$pattern_file" << EOF
=== DETECTION PATTERN ANALYSIS ===
Date: $(date -Iseconds)
Total executions: $TOTAL_EXECUTIONS

## DETECTION RESULTS SUMMARY

EOF
    
    echo "Execution | Pattern | Duration | Notes" >> "$pattern_file"
    echo "----------|---------|----------|------" >> "$pattern_file"
    
    local both_unavailable_count=0
    local both_available_count=0
    local mixed_count=0
    
    for result in "${detection_results[@]}"; do
        IFS=':' read -r exec_num pattern duration <<< "$result"
        printf "%-9s | %-7s | %-8s |\n" "#$exec_num" "$pattern" "$duration" >> "$pattern_file"
        
        case $pattern in
            "both_unavailable") ((both_unavailable_count++)) ;;
            "both_available") ((both_available_count++)) ;;
            "mixed") ((mixed_count++)) ;;
        esac
    done
    
    echo "" >> "$pattern_file"
    echo "## PATTERN SUMMARY" >> "$pattern_file"
    echo "Both unavailable: $both_unavailable_count/$TOTAL_EXECUTIONS" >> "$pattern_file"
    echo "Both available: $both_available_count/$TOTAL_EXECUTIONS" >> "$pattern_file"
    echo "Mixed results: $mixed_count/$TOTAL_EXECUTIONS" >> "$pattern_file"
    
    # Check for alternating pattern (RF-003.1 evidence)
    if [ $both_unavailable_count -gt 0 ] && [ $both_available_count -gt 0 ]; then
        echo "" >> "$pattern_file"
        echo "🔴 CRITICAL: Alternating pattern detected (RF-003.1 confirmed)" >> "$pattern_file"
        echo "This confirms environment detection inconsistency issue" >> "$pattern_file"
    else
        echo "" >> "$pattern_file"
        echo "ℹ️  Consistent pattern detected" >> "$pattern_file"
    fi
    
    log_with_timestamp "Detection pattern analysis completed"
}

# Function to generate timeout analysis
analyze_timeout_performance() {
    local timeout_file="$LOG_DIR/timeout-analysis-comparison.log"
    
    cat > "$timeout_file" << EOF
=== TIMEOUT & PERFORMANCE ANALYSIS ===
Date: $(date -Iseconds)
Target improvements: 20% faster execution, 25% timeout protection

## EXECUTION TIMES

EOF
    
    echo "Execution | Duration | vs Target | vs Timeout | Status" >> "$timeout_file"
    echo "----------|----------|-----------|------------|-------" >> "$timeout_file"
    
    local total_time=0
    local timeout_count=${#timeout_events[@]}
    
    for i in "${!execution_times[@]}"; do
        local duration=${execution_times[$i]}
        local exec_num=$((i + 1))
        total_time=$((total_time + duration))
        
        local vs_target=""
        if [ $duration -le 28 ]; then
            vs_target="✅ Under target"
        else
            vs_target="❌ Over target"
        fi
        
        local vs_timeout=""
        if [ $duration -le $BASE_TIMEOUT ]; then
            vs_timeout="✅ Within timeout"
        else
            vs_timeout="⏰ Exceeded timeout"
        fi
        
        printf "%-9s | %-8s | %-9s | %-10s | %-6s\n" "#$exec_num" "${duration}s" "$vs_target" "$vs_timeout" "OK" >> "$timeout_file"
    done
    
    local avg_time=$((total_time / TOTAL_EXECUTIONS))
    
    echo "" >> "$timeout_file"
    echo "## PERFORMANCE SUMMARY" >> "$timeout_file"
    echo "Average execution time: ${avg_time}s" >> "$timeout_file"
    echo "Target time: 28s (-20% improvement)" >> "$timeout_file"
    echo "Protection timeout: ${BASE_TIMEOUT}s (+25%)" >> "$timeout_file"
    echo "Total timeout events: $timeout_count" >> "$timeout_file"
    
    if [ $timeout_count -eq 0 ]; then
        echo "✅ SUCCESS: No timeout events detected" >> "$timeout_file"
    else
        echo "❌ ISSUE: $timeout_count timeout events detected" >> "$timeout_file"
        for event in "${timeout_events[@]}"; do
            echo "   - $event" >> "$timeout_file"
        done
    fi
    
    # Performance vs target analysis
    if [ $avg_time -le 28 ]; then
        echo "✅ PERFORMANCE: Already meeting target (<28s average)" >> "$timeout_file"
    else
        local improvement_needed=$((avg_time - 28))
        echo "❌ PERFORMANCE: Need ${improvement_needed}s improvement to reach target" >> "$timeout_file"
    fi
    
    log_with_timestamp "Timeout analysis completed"
}

# Main execution loop
echo -e "${YELLOW}Starting forensic analysis...${NC}"
echo ""

for i in $(seq 1 $TOTAL_EXECUTIONS); do
    echo -e "${BLUE}--- Execution #$i/$TOTAL_EXECUTIONS ---${NC}"
    
    # Use base timeout, escalate if previous execution timed out
    current_timeout=$BASE_TIMEOUT
    if [ $i -gt 1 ] && [ ${#timeout_events[@]} -gt 0 ]; then
        # Check if last execution timed out
        last_event="${timeout_events[-1]}"
        if [[ "$last_event" == *"#$((i-1))"* ]]; then
            current_timeout=$ESCALATION_TIMEOUT
            log_with_timestamp "⚠️  Using escalated timeout (${ESCALATION_TIMEOUT}s) due to previous timeout"
        fi
    fi
    
    # Execute with timeout protection
    if execute_qa_cli_with_timeout $i $current_timeout; then
        # No timeout, continue with base timeout
        true
    else
        # Timeout occurred, logged in function
        true
    fi
    
    # Brief pause between executions to avoid race conditions
    if [ $i -lt $TOTAL_EXECUTIONS ]; then
        sleep 2
    fi
    
    echo ""
done

# Generate analysis reports
echo -e "${YELLOW}Analyzing results...${NC}"
analyze_detection_patterns
analyze_timeout_performance

# Final summary
end_time=$(date +%s)
total_duration=$((end_time - start_time))

echo ""
echo -e "${GREEN}=== FORENSIC ANALYSIS COMPLETE ===${NC}"
echo "Total duration: ${total_duration}s"
echo "Executions: $TOTAL_EXECUTIONS"
echo "Timeout events: ${#timeout_events[@]}"
echo "Average execution time: $(($(IFS=+; echo "$((${execution_times[*]}))")/ TOTAL_EXECUTIONS))s"
echo ""
echo "Generated files:"
echo "  - execution-sequence-01.log through execution-sequence-10.log"
echo "  - detection-method-comparison.log"
echo "  - timeout-analysis-comparison.log"
echo ""

if [ ${#timeout_events[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ SUCCESS: No timeout events detected${NC}"
else
    echo -e "${RED}⚠️  WARNING: ${#timeout_events[@]} timeout events detected${NC}"
    echo "Review timeout-analysis-comparison.log for details"
fi

echo ""
echo "Next steps:"
echo "1. Review execution logs for detection inconsistencies" 
echo "2. Analyze patterns in detection-method-comparison.log"
echo "3. Check timeout-analysis-comparison.log for performance issues"
echo "4. Proceed with fixes based on forensic evidence"
echo ""
echo -e "${BLUE}Forensic analysis ready for issue remediation.${NC}"