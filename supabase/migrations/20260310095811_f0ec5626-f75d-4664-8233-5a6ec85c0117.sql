
CREATE OR REPLACE FUNCTION public.check_tug_fall_risk()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.tipo = 'TUG' AND NEW.valor_numerico > 12 THEN
    UPDATE public.patients
    SET high_fall_risk = true
    WHERE id = NEW.patient_id;

    INSERT INTO public.alerts (patient_id, alert_type, severity, source_metric, source_value, source_test_id, message)
    VALUES (
      NEW.patient_id,
      'fall_risk'::alert_type,
      (CASE WHEN NEW.valor_numerico > 20 THEN 'critical'
           WHEN NEW.valor_numerico > 15 THEN 'high'
           ELSE 'medium' END)::alert_severity,
      'TUG',
      NEW.valor_numerico,
      NEW.id,
      'TUG = ' || NEW.valor_numerico || 's — Riesgo de caída elevado'
    );
  END IF;
  RETURN NEW;
END;
$function$;
