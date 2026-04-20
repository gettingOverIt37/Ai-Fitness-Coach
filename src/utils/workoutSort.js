export function sortWorkoutsByPerformedAtDesc(workouts) {
  return [...workouts].sort(
    (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime(),
  );
}
