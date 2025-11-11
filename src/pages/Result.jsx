import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Typography,
} from "@material-tailwind/react";
import { useMeal } from "@/context/meal";
import { resolveBackendImage } from "@/api";
import { formatMealDate } from "@/utils/meals";

export default function Result() {
  const { capture, analysis, setCapture, setAnalysis, refreshMeals } = useMeal();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!analysis) {
      navigate("/dashboard/home", { replace: true });
    }
  }, [analysis, navigate]);

  const imageSrc = useMemo(() => {
    if (analysis?.previewUrl) return analysis.previewUrl;
    if (capture?.previewUrl) return capture.previewUrl;
    const backendImage = analysis?.image || analysis?.image_url;
    if (backendImage) return resolveBackendImage(backendImage);
    return "/img/home-decor-1.jpeg";
  }, [analysis, capture]);

  const predictions = useMemo(() => {
    if (Array.isArray(analysis?.predictions)) return analysis.predictions;
    if (Array.isArray(analysis?.raw?.hf_predictions)) {
      return analysis.raw.hf_predictions;
    }
    return [];
  }, [analysis]);

  const mealName = analysis?.food || analysis?.meal || "Logged Meal";
  const mealDate = analysis?.capturedAt
    ? formatMealDate(analysis.capturedAt)
    : analysis?.raw?.timestamp
    ? formatMealDate(analysis.raw.timestamp)
    : null;
  const formatScore = (score) => {
    if (typeof score !== "number") return null;
    const normalizedScore = score > 1 ? score : score * 100;
    return `${normalizedScore.toFixed(1)}%`;
  };

  const resetFlow = () => {
    setCapture(null);
    setAnalysis(null);
  };

  const handleCancel = () => {
    resetFlow();
    navigate("/dashboard/home", { replace: true });
  };

  const handleSave = async () => {
    if (!analysis) return;
    setError("");
    setSaving(true);

    try {
      await refreshMeals();
      resetFlow();
      navigate("/dashboard/home", { replace: true });
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.data?.error ||
          err?.message ||
          "Unable to save this meal right now. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Card className="w-full max-w-3xl border border-orange-100/60 bg-white/90 shadow-2xl shadow-orange-200/50 backdrop-blur">
        <CardBody className="flex flex-col gap-8 p-8 sm:p-10">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <Typography variant="h4" className="text-[var(--food-primary-dark)]">
                {mealName}
              </Typography>
              <div className="overflow-hidden rounded-3xl border border-orange-100/60 bg-orange-50/60 shadow-inner">
                <img
                  src={imageSrc}
                  alt={mealName}
                  className="h-64 w-full object-cover"
                />
              </div>
              {mealDate && (
                <Typography variant="small" className="text-slate-500">
                  Logged for {mealDate}
                </Typography>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-teal-50 px-5 py-4 text-[var(--food-primary)] shadow-inner">
                <Typography variant="small" className="uppercase tracking-wide text-[var(--food-primary-dark)]">
                  Detected Meal
                </Typography>
                <Typography variant="h5" className="mt-2 font-semibold text-[var(--food-primary-dark)]">
                  {mealName}
                </Typography>
                {predictions[0]?.score && (
                  <Typography variant="small" className="mt-1 text-slate-600">
                    Confidence {formatScore(predictions[0].score)}
                  </Typography>
                )}
              </div>
              <div>
                <Typography variant="small" className="font-semibold uppercase text-slate-500">
                  Hugging Face Predictions
                </Typography>
                {predictions.length ? (
                  <ul className="mt-3 space-y-2">
                    {predictions.map((prediction, index) => (
                      <li
                        key={`${prediction.label ?? "prediction"}-${index}`}
                        className="rounded-xl border border-orange-50 bg-orange-50/60 px-4 py-2 text-sm text-[var(--food-primary-dark)]"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium">
                            {index + 1}. {prediction.label || "Unknown"}
                          </span>
                          {formatScore(prediction.score) && (
                            <span className="text-[var(--food-primary)]">
                              {formatScore(prediction.score)}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-2 rounded-xl border border-dashed border-orange-200 px-4 py-3 text-sm text-orange-300">
                    Additional predictions are unavailable, but we detected {mealName}.
                  </div>
                )}
              </div>
            </div>
          </div>
          {error && (
            <Typography variant="small" color="red" className="font-medium">
              {error}
            </Typography>
          )}
        </CardBody>
        <CardFooter className="flex flex-col gap-3 border-t border-orange-100/60 bg-orange-50/60 px-8 py-6 sm:flex-row sm:justify-end">
          <Button
            variant="outlined"
            color="orange"
            onClick={handleCancel}
            className="w-full border-orange-200 text-[var(--food-primary-dark)] hover:bg-orange-50 sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            color="orange"
            onClick={handleSave}
            disabled={saving}
            className="w-full font-semibold shadow-lg shadow-orange-300/40 sm:w-auto"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
