
-- ============================================================
-- SPRINT 1, STEP 1: Attach 4 missing triggers
-- ============================================================

-- 1) PHQ-9 alert trigger on clinical_tests INSERT
CREATE TRIGGER trg_check_phq9_alert
  AFTER INSERT ON public.clinical_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_phq9_alert();

-- 2) TUG fall risk trigger on clinical_tests INSERT
CREATE TRIGGER trg_check_tug_fall_risk
  AFTER INSERT ON public.clinical_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_tug_fall_risk();

-- 3) Session completed → incentive trigger on sessions UPDATE
CREATE TRIGGER trg_on_session_completed
  AFTER UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.on_session_completed();

-- 4) Clinical improvement bonus trigger on clinical_tests INSERT
CREATE TRIGGER trg_check_clinical_improvement
  AFTER INSERT ON public.clinical_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_clinical_improvement();
