// store/slices/gradesSlice.ts
import { createSlice, PayloadAction, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/app/store/index';
import { supabase } from '@/lib/supabase';

export interface Grade {
  id: string;
  grade_label: string;
  material_id: number;
  [key: string]: any;
}

interface GradesState {
  grades: Record<string, Grade>;
  gradeMap: Record<string, string>;
  loading: boolean;
  error: string | null;
}

const initialState: GradesState = {
  grades: {},
  gradeMap: {},
  loading: false,
  error: null,
};

export const fetchGrades = createAsyncThunk(
  'grades/fetchGrades',
  async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('No access token found. Please log in.');
      const res = await fetch('/api/grades', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      }
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected an array');
      }
      return data as Grade[];
    } catch (error) {
      console.error("Error fetching grades:", error);
      throw error;
    }
  }
);

const gradesSlice = createSlice({
  name: 'grades',
  initialState,
  reducers: {
    setGrades(state, action: PayloadAction<Grade[]>) {
      const grades = action.payload || [];
      state.grades = Object.fromEntries(grades.map((g) => [String(g.id), g]));
      state.gradeMap = Object.fromEntries(grades.map((g) => [String(g.id), g.grade_label]));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGrades.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGrades.fulfilled, (state, action) => {
        state.loading = false;
        const grades = action.payload || [];
        state.grades = Object.fromEntries(grades.map((g) => [String(g.id), g]));
        state.gradeMap = Object.fromEntries(grades.map((g) => [String(g.id), g.grade_label]));
      })
      .addCase(fetchGrades.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load grades';
        console.error("Grades fetch rejected:", action.error);
      });
  },
});

export const selectGradesArray = createSelector(
  (state: RootState) => state.grades.grades,
  (grades) => Object.values(grades)
);

export const selectGradeNameById = (id: string) => createSelector(
  (state: RootState) => state.grades.grades,
  (grades) => grades[String(id)]?.grade_label
);

export const selectGradeMap = createSelector(
  (state: RootState) => state.grades.gradeMap,
  (gradeMap) => gradeMap
);

console.log("selectGradeMap", selectGradeMap);
export const selectGradesByMaterialId = (materialId: number) => createSelector(
  (state: RootState) => state.grades.grades,
  (grades) => Object.values(grades).filter((grade) => grade.material_id === materialId)
);

export const { setGrades } = gradesSlice.actions;

export default gradesSlice.reducer;