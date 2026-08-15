import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ProgramExercise } from "@/lib/types";
import { WorkoutExerciseRow } from "./WorkoutExerciseRow";

const exercise: ProgramExercise = {
  id: "exercise-1",
  programId: "program-1",
  exerciseId: "bench-press",
  exercise: {
    id: "bench-press",
    name: "پرس سینه",
    category: "strength",
    muscleGroup: "chest",
    difficulty: "intermediate",
    equipment: "barbell",
    instructions: "روی نیمکت پرس سینه را انجام دهید.",
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  dayOfWeek: 0,
  order: 1,
  sets: 3,
  reps: "10",
  restSeconds: 60,
  isCompleted: false,
};

function ControlledRow({ onChange }: { onChange: (checked: boolean) => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <WorkoutExerciseRow
      exercise={exercise}
      checked={checked}
      onCheckedChange={(nextChecked) => {
        setChecked(nextChecked);
        onChange(nextChecked);
      }}
    />
  );
}

describe("WorkoutExerciseRow", () => {
  it("changes once when the row text is clicked", async () => {
    const onChange = vi.fn();
    render(<ControlledRow onChange={onChange} />);

    await userEvent.click(screen.getByText("پرس سینه"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("changes once when the checkbox is clicked", async () => {
    const onChange = vi.fn();
    render(<ControlledRow onChange={onChange} />);

    await userEvent.click(screen.getByRole("checkbox"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(true);
  });
});
