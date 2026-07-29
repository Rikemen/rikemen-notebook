<template>
  <HomeNotesSummary
    v-if="currentUser"
    :current-user="currentUser"
    :notes="notes"
    :persistence-error="persistenceError"
    @delete-note="deleteNote"
    @duplicate-note="duplicateNote"
    @create-note="createNote"
    @toggle-favorite="toggleFavorite"
  />
  <HomeUsageGuide v-else />
</template>

<script lang="ts">
import { computed, defineComponent, watch } from "vue";
import { mapFirebaseUser } from "@/features/auth/mapFirebaseUser";
import { useNotesStore } from "@/features/notes/notesStore";
import HomeNotesSummary from "@/components/home/HomeNotesSummary.vue";
import HomeUsageGuide from "@/components/home/HomeUsageGuide.vue";
import type { CreateNoteInput } from "@/features/notes/types";
import { useStore } from "@/store/index";

export default defineComponent({
  name: "HomePage",
  components: {
    HomeNotesSummary,
    HomeUsageGuide,
  },
  setup() {
    const authStore = useStore();
    const notesStore = useNotesStore();
    const currentUser = computed(() => mapFirebaseUser(authStore.user ?? null));
    const notes = computed(() => {
      if (!currentUser.value) {
        return [];
      }

      return notesStore.notesForUser(currentUser.value.uid);
    });
    const persistenceError = computed(() => notesStore.saveError || notesStore.loadError);
    watch(currentUser, (user) => {
      notesStore.loadNotes(user).catch(() => undefined);
    }, { immediate: true });
    const noteActions = {
      createNote: async (input: CreateNoteInput) => {
        await notesStore.createNote(input, currentUser.value);
      },
      deleteNote: (noteId: string) => {
        notesStore.deleteNote(noteId, currentUser.value).catch(() => undefined);
      },
      duplicateNote: (noteId: string) => {
        notesStore.duplicateNote(noteId, currentUser.value).catch(() => undefined);
      },
      toggleFavorite: (noteId: string) => {
        notesStore.toggleFavorite(noteId, currentUser.value).catch(() => undefined);
      },
    };

    return {
      currentUser,
      notes,
      ...noteActions,
      persistenceError,
    };
  },
});
</script>
