# Governance Framework - Migration

## 🎯 FUENTES DE VERDAD (Validadas)
1. **PRD v2.0**: `docs/PRD-QA CLI v2.0.md` ✅ Exists
2. **ADR-009**: `docs/adr/ADR-009-qa-cli-direct-linters-architecture.md` ✅ Exists
3. **Baseline**: `qa-analysis-logs/qa-levels/` ✅ Exists

## 🚨 GAP DISCOVERY PROTOCOL
**Si situación undefined/ambigua**:
1. 🛑 STOP - No assumptions
2. 📝 Document en `gaps-discovered.log` 
3. 💬 Discuss con stakeholder
4. 📋 Update docs (PRD/ADR)
5. ▶️ Resume con guidance

## 🔄 RECOVERY STRATEGY
**Philosophy**: Preserve gains + targeted fixes (NO full rollback)
1. **Targeted fixes** (preferred)
2. **Partial component rollback** 
3. **Hybrid approach**
4. **Full rollback** (last resort only)

## 📊 VALIDATION CHECKPOINTS
- ✅ GREEN: Continue
- 🟡 YELLOW: Fix + continue  
- 🔴 RED: Gap protocol