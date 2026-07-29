<template>
  <main class="notes-view">
    <section class="notes-view__hero">
      <div>
        <p class="notes-view__eyebrow">マイノート</p>
        <h1>数学ノート</h1>
        <p>自分の学習ノートを作成、検索、整理できます。</p>
      </div>
    </section>

    <section v-if="!currentUser" class="notes-view__auth-card">
      <h2>保存と履歴にはログインが必要です</h2>
      <p>Googleアカウントで登録・ログインすると、ノートと教材履歴を保存できます。</p>
      <div class="notes-view__auth-actions">
        <router-link class="notes-view__primary-link" to="/login">ログインへ進む</router-link>
        <router-link class="notes-view__secondary-link" to="/signup">新規登録</router-link>
      </div>
    </section>

    <template v-else>
      <section class="notes-view__search-card" aria-label="ノート検索">
        <label>
          ノートを検索
          <input
            data-testid="note-search"
            placeholder="ノートタイトルまたはタグを入力"
            :value="searchText"
            @input="updateSearchText"
          />
        </label>
        <button data-testid="open-create-note" type="button" @click="openCreateModal">ノートを作成</button>
      </section>
      <p v-if="persistenceError" class="notes-view__error" role="alert">{{ persistenceError }}</p>

      <section v-if="visibleNotes.length > 0" class="notes-view__grid">
        <NoteCard
          v-for="note in visibleNotes"
          :key="note.id"
          :current-user="currentUser"
          :note="note"
          @delete="deleteNote"
          @duplicate="duplicateNote"
          @open="openNote"
          @toggle-favorite="toggleFavorite"
        />
      </section>
      <section v-else class="notes-view__empty-state">
        <p>{{ emptyMessage }}</p>
        <button v-if="allUserNotes.length === 0" type="button" @click="openCreateModal">ノートを作成</button>
      </section>
    </template>

    <NoteCreateModal
      v-if="isCreateModalOpen"
      @close="closeCreateModal"
      @create="createNote"
    />
  </main>
</template>

<script lang="ts">
/* eslint-disable max-lines-per-function, max-statements */
import { computed, defineComponent, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { mapFirebaseUser } from "@/features/auth/mapFirebaseUser";
import { useNotesStore } from "@/features/notes/notesStore";
import { searchNotes } from "@/features/notes/searchNotes";
import type { CreateNoteInput } from "@/features/notes/types";
import NoteCreateModal from "@/components/notes/NoteCreateModal.vue";
import NoteCard from "@/components/notes/NoteCard.vue";
import { useStore } from "@/store/index";

export default defineComponent({
  name: "NotesListView",
  components: {
    NoteCard,
    NoteCreateModal,
  },
  setup() {
    const authStore = useStore();
    const notesStore = useNotesStore();
    const router = useRouter();
    const searchText = ref("");
    const isCreateModalOpen = ref(false);
    const currentUser = computed(() => mapFirebaseUser(authStore.user ?? null));
    const allUserNotes = computed(() => {
      if (!currentUser.value) {
        return [];
      }

      return notesStore.notesForUser(currentUser.value.uid);
    });
    const visibleNotes = computed(() => searchNotes(allUserNotes.value, { keyword: searchText.value }));
    const persistenceError = computed(() => notesStore.saveError || notesStore.loadError);
    const emptyMessage = computed(() => {
      if (allUserNotes.value.length === 0) {
        return "ノートがまだありません。最初のノートを作成しましょう。";
      }

      return "検索条件に一致するノートはありません。";
    });

    watch(currentUser, (user) => {
      notesStore.loadNotes(user).catch(() => undefined);
    }, { immediate: true });

    const openCreateModal = () => {
      isCreateModalOpen.value = true;
    };
    const closeCreateModal = () => {
      isCreateModalOpen.value = false;
    };
    const createNote = async (input: CreateNoteInput) => {
      const note = await notesStore.createNote(input, currentUser.value);
      if (note) {
        closeCreateModal();
      }
    };
    const deleteNote = (noteId: string) => {
      notesStore.deleteNote(noteId, currentUser.value).catch(() => undefined);
    };
    const duplicateNote = (noteId: string) => {
      notesStore.duplicateNote(noteId, currentUser.value).catch(() => undefined);
    };
    const toggleFavorite = (noteId: string) => {
      notesStore.toggleFavorite(noteId, currentUser.value).catch(() => undefined);
    };
    const openNote = (noteId: string) => {
      router.push(`/notes/${noteId}`);
    };
    const updateSearchText = (event: Event) => {
      searchText.value = (event.target as HTMLInputElement).value;
    };

    return {
      allUserNotes,
      closeCreateModal,
      createNote,
      currentUser,
      deleteNote,
      duplicateNote,
      emptyMessage,
      isCreateModalOpen,
      notesStore,
      openCreateModal,
	      openNote,
	      persistenceError,
	      searchText,
      toggleFavorite,
      updateSearchText,
      visibleNotes,
    };
  },
});
</script>
