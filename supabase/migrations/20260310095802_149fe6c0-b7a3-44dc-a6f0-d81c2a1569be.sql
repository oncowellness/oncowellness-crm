
CREATE OR REPLACE FUNCTION public.check_phq9_alert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.tipo = 'PHQ-9' AND NEW.valor_numerico >= 10 THEN
    UPDATE public.patients
    SET alert_status = 'rojo', mind_state = 'Depresivo'
    WHERE id = NEW.patient_id;

    INSERT INTO public.crisis_orders (patient_id, trigger_reason, program, status)
    VALUES (
      NEW.patient_id,
      'PHQ-9 >= 10 (Puntuación: ' || NEW.valor_numerico || ')',
      'PS-01',
      'pendiente'
    );

    INSERT INTO public.alerts (patient_id, alert_type, severity, source_metric, source_value, source_test_id, message)
    VALUES (
      NEW.patient_id,
      'emotional_risk'::alert_type,
      (CASE WHEN NEW.valor_numerico >= 20 THEN 'critical'
           WHEN NEW.valor_numerico >= 15 THEN 'high'
           ELSE 'medium' END)::alert_severity,
      'PHQ-9',
      NEW.valor_numerico,
      NEW.id,
      'PHQ-9 = ' || NEW.valor_numerico || ' — Riesgo emocional detectado'
    );
  END IF;
  RETURN NEW;
END;
$function$;
