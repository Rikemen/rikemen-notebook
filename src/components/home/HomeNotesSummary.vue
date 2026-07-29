<template>
  <section class="home-notes-summary">
    <div class="home-notes-summary__header">
      <div>
        <p class="home-notes-summary__eyebrow">マイノート</p>
        <h1>{{ heading }}</h1>
      </div>
      <div class="home-notes-summary__actions">
        <router-link class="home-notes-summary__link" to="/notes">ノート一覧へ</router-link>
        <button class="home-notes-summary__create-button" type="button" @click="openCreateModal">ノートブック新規作成</button>
      </div>
    </div>

    <section class="home-notes-summary__filters" aria-label="ノート検索">
      <label>
        ノート検索
        <input data-testid="home-note-search" :value="keyword" @input="updateKeyword" />
      </label>

      <div v-if="availableTags.length > 0" class="home-notes-summary__tag-filter" aria-label="タグ絞り込み">
        <span>タグ</span>
        <button
          v-for="tag in availableTags"
          :key="tag"
          :aria-pressed="selectedTag === tag"
          data-testid="home-tag-filter"
          @click="selectTag(tag)"
        >
          {{ tag }}
        </button>
        <button
          v-if="selectedTag"
          class="home-notes-summary__clear"
          data-testid="home-tag-clear"
          @click="clearTag"
        >
          すべて
        </button>
      </div>
    </section>
    <p v-if="persistenceError" class="home-notes-summary__error" role="alert">{{ persistenceError }}</p>

    <div class="home-notes-summary__grid">
      <NoteCard
        v-for="note in visibleNotes"
        :key="note.id"
        :current-user="currentUser"
        :note="note"
        @open="openNote"
        @delete="$emit('delete-note', $event)"
        @duplicate="$emit('duplicate-note', $event)"
        @toggle-favorite="$emit('toggle-favorite', $event)"
      />
    </div>
    <p v-if="visibleNotes.length === 0" class="home-notes-summary__empty">該当するノートはありません。</p>
    <NoteCreateModal
      v-if="isCreateModalOpen"
      @close="closeCreateModal"
      @create="createNote"
    />
  </section>
</template>

<script lang="ts">
/* eslint-disable max-lines-per-function, max-statements */
import { computed, defineComponent, ref, type PropType } from "vue";
import { useRouter } from "vue-router";
import { searchNotes } from "@/features/notes/searchNotes";
import type { CreateNoteInput, MathNote } from "@/features/notes/types";
import type { AuthUser } from "@/features/auth/types";
import NoteCreateModal from "@/components/notes/NoteCreateModal.vue";
import NoteCard from "@/components/notes/NoteCard.vue";

const createHeading = (selectedTag: string) => {
  if (selectedTag) {
    return `${selectedTag}のノート`;
  }

  return "すべてのノート";
};

const resolveSelectedTag = (currentTag: string, nextTag: string) => {
  if (currentTag === nextTag) {
    return "";
  }

  return nextTag;
};

export default defineComponent({
  name: "HomeNotesSummary",
  components: {
    NoteCreateModal,
    NoteCard,
  },
  props: {
    currentUser: {
      required: true,
      type: Object as PropType<AuthUser>,
    },
    notes: {
      required: true,
      type: Array as PropType<MathNote[]>,
    },
    persistenceError: {
      default: "",
      type: String,
    },
  },
  emits: ["create-note", "delete-note", "duplicate-note", "toggle-favorite"],
  setup(props, { emit }) {
    const router = useRouter();
    const state = { isCreateModalOpen: ref(false), keyword: ref(""), selectedTag: ref("") };
    const availableTags = computed(() =>
      [...new Set(props.notes.flatMap((note) => note.tags))].filter(Boolean).sort((first, second) => first.localeCompare(second, "ja")),
    );
    const heading = computed(() => createHeading(state.selectedTag.value));
    const visibleNotes = computed(() =>
      searchNotes(props.notes, {
        keyword: state.keyword.value,
        tag: state.selectedTag.value,
      }),
    );
    const updateKeyword = (event: Event) => {
      state.keyword.value = (event.target as HTMLInputElement).value;
    };
    const selectTag = (tag: string) => {
      state.selectedTag.value = resolveSelectedTag(state.selectedTag.value, tag);
    };
    const clearTag = () => {
      state.selectedTag.value = "";
    };
    const openNote = (noteId: string) => {
      router.push(`/notes/${noteId}`);
    };
    const openCreateModal = () => {
      state.isCreateModalOpen.value = true;
    };
    const closeCreateModal = () => {
      state.isCreateModalOpen.value = false;
    };
    const createNote = (input: CreateNoteInput) => {
      closeCreateModal();
      emit("create-note", input);
    };

    return {
      availableTags,
      clearTag,
      closeCreateModal,
      createNote,
      heading,
      isCreateModalOpen: state.isCreateModalOpen,
      keyword: state.keyword,
      openCreateModal,
      openNote,
      selectedTag: state.selectedTag,
      selectTag,
      updateKeyword,
      visibleNotes,
    };
  },
});
</script>
