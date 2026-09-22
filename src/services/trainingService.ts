import { LessonCategory, TRAINING_LESSONS, TrainingLesson } from '../data/trainingLessons';

export interface UserTrainingProgress {
  completedLessonIds: string[];
  lastPracticedId: string | null;
  practiceCounts: Record<string, number>;
  totalExercisesCompleted: number;
}

const STORAGE_KEY = 'grandmaster_training_progress_v1';

class TrainingService {
  private progress: UserTrainingProgress;

  constructor() {
    this.progress = this.loadProgress();
  }

  private loadProgress(): UserTrainingProgress {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return {
      completedLessonIds: [],
      lastPracticedId: null,
      practiceCounts: {},
      totalExercisesCompleted: 0,
    };
  }

  private saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch {
      // ignore
    }
  }

  public getProgress(): UserTrainingProgress {
    return { ...this.progress };
  }

  public isLessonCompleted(lessonId: string): boolean {
    return this.progress.completedLessonIds.includes(lessonId);
  }

  public markLessonCompleted(lessonId: string): void {
    if (!this.progress.completedLessonIds.includes(lessonId)) {
      this.progress.completedLessonIds.push(lessonId);
    }
    this.progress.lastPracticedId = lessonId;
    this.progress.practiceCounts[lessonId] = (this.progress.practiceCounts[lessonId] || 0) + 1;
    this.progress.totalExercisesCompleted += 1;
    this.saveProgress();
  }

  public getCategoryMastery(category: LessonCategory): { completed: number; total: number; percentage: number } {
    const lessonsInCat = TRAINING_LESSONS.filter((l) => l.category === category);
    const total = lessonsInCat.length;
    if (total === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = lessonsInCat.filter((l) => this.isLessonCompleted(l.id)).length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  }

  public getOverallStats(): {
    totalLessons: number;
    completedLessons: number;
    completionPercentage: number;
    openingsMastery: number;
    openingTacticsMastery: number;
    middlegameMastery: number;
    endgameMastery: number;
  } {
    const total = TRAINING_LESSONS.length;
    const completed = this.progress.completedLessonIds.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      totalLessons: total,
      completedLessons: completed,
      completionPercentage: pct,
      openingsMastery: this.getCategoryMastery('openings').percentage,
      openingTacticsMastery: this.getCategoryMastery('opening-tactics').percentage,
      middlegameMastery: this.getCategoryMastery('middlegame-tactics').percentage,
      endgameMastery: this.getCategoryMastery('endgame-tactics').percentage,
    };
  }

  public getNextRecommendedLesson(): TrainingLesson | null {
    const uncompleted = TRAINING_LESSONS.filter((l) => !this.isLessonCompleted(l.id));
    if (uncompleted.length > 0) {
      return uncompleted[0];
    }
    return TRAINING_LESSONS[0] || null;
  }

  public resetProgress(): void {
    this.progress = {
      completedLessonIds: [],
      lastPracticedId: null,
      practiceCounts: {},
      totalExercisesCompleted: 0,
    };
    this.saveProgress();
  }
}

export const trainingService = new TrainingService();
