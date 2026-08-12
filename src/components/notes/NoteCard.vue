<template>
  <article class="note-card">
    <div class="note-card__header">
      <div class="note-card__title-group">
        <h2>{{ note.title }}</h2>
        <p v-if="note.subject">{{ note.subject }}</p>
      </div>
      <button class="note-card__favorite" :disabled="!canEdit" data-testid="favorite-note" @click="$emit('toggle-favorite', note.id)">
        {{ note.favorite ? "お気に入り解除" : "お気に入り" }}
      </button>
    </div>
    <div class="note-card__tags">
      <span v-for="tag in note.tags" :key="tag">
        {{ tag }}
      </span>
    </div>
    <div class="note-card__actions">
      <button class="note-card__primary" data-testid="open-note" @click="$emit('open', note.id)">開く</button>
      <button class="note-card__secondary" :disabled="!canEdit" data-testid="duplicate-note" @click="$emit('duplicate', note.id)">複製</button>
      <button class="note-card__danger" :disabled="!canEdit" data-testid="delete-note" @click="requestDelete">削除</button>
    </div>
  </article>
  <NoteDeleteConfirmDialog v-if="isDeleteConfirmOpen" :note-title="note.title" @close="closeDeleteConfirm" @confirm="confirmDelete" />
</template>

<script lang="ts">
import { computed, defineComponent, ref, type PropType } from "vue";
import type { AuthUser } from "@/features/auth/types";
import type { MathNote } from "@/features/notes/types";
import NoteDeleteConfirmDialog from "@/components/notes/NoteDeleteConfirmDialog.vue";

export default defineComponent({
  name: "NoteCard",
  components: {
    NoteDeleteConfirmDialog,
  },
  props: {
    currentUser: {
      default: null,
      type: Object as PropType<AuthUser | null>,
    },
    note: {
      required: true,
      type: Object as PropType<MathNote>,
    },
  },
  emits: ["open", "duplicate", "delete", "toggle-favorite"],
  setup(props, { emit }) {
    const canEdit = computed(() => props.currentUser?.uid === props.note.ownerUid);
    const isDeleteConfirmOpen = ref(false);
    const requestDelete = () => {
      if (canEdit.value) {
        isDeleteConfirmOpen.value = true;
      }
    };
    const closeDeleteConfirm = () => {
      isDeleteConfirmOpen.value = false;
    };
    const confirmDelete = () => {
      if (!isDeleteConfirmOpen.value) {
        return;
      }

      closeDeleteConfirm();
      emit("delete", props.note.id);
    };

    return {
      canEdit,
      closeDeleteConfirm,
      confirmDelete,
      isDeleteConfirmOpen,
      requestDelete,
    };
  },
});
</script>

<style scoped>
.note-card {
  display: grid;
  gap: var(--space-3);
  min-width: 0;
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-raised);
  color: var(--color-text-primary);
  padding: var(--space-4);
  text-align: left;
}

.note-card__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-3);
  min-width: 0;
}

.note-card__title-group {
  min-width: 0;
}

.note-card h2 {
  overflow: hidden;
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.05rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-card p {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: 0.84rem;
}

.note-card__tags,
.note-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.note-card__tags span {
  border-radius: var(--radius-pill);
  background: var(--color-surface-inset);
  box-shadow: var(--shadow-inset);
  color: var(--color-text-secondary);
  font-size: 0.74rem;
  padding: 0.25rem 0.6rem;
}

.note-card button {
  min-height: 34px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 800;
  padding: 0 var(--space-3);
}

.note-card button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.note-card__favorite,
.note-card__secondary {
  flex: 0 0 auto;
  background: var(--color-surface);
  box-shadow: var(--shadow-raised-sm);
  color: var(--color-text-primary);
}

.note-card__primary {
  background: var(--color-blue);
  box-shadow: var(--shadow-raised-sm);
  color: white;
}

.note-card__danger {
  border: 1px solid var(--color-red-soft);
  background: white;
  color: var(--color-red);
}
</style>
