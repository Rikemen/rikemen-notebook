<template>
  <form class="create-note-form" @submit.prevent="submit">
    <label>
      タイトル
      <input v-model="title" data-testid="note-title" />
    </label>
    <label>
      タグ
      <input v-model="tags" data-testid="note-tags" placeholder="極限, 導関数" />
    </label>
    <p v-if="errorMessage" class="create-note-form__error">{{ errorMessage }}</p>
    <button :disabled="disabled">
      ノートを作成
    </button>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { normalizeTags, validateNoteInput } from "@/features/notes/validateNoteInput";

export default defineComponent({
  name: "CreateNoteForm",
  props: {
    disabled: {
      default: false,
      type: Boolean,
    },
  },
  emits: ["create"],
  setup(_props, { emit }) {
    const title = ref("");
    const tags = ref("");
    const errorMessage = ref("");
    const input = computed(() => ({
      tags: normalizeTags(tags.value),
      title: title.value,
    }));

    const submit = () => {
      const validation = validateNoteInput(input.value);
      if (!validation.ok) {
        errorMessage.value = validation.message;
        return;
      }

      errorMessage.value = "";
      emit("create", input.value);
      title.value = "";
      tags.value = "";
    };

    return {
      errorMessage,
      submit,
      tags,
      title,
    };
  },
});
</script>

<style scoped>
.create-note-form {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) auto;
  gap: var(--space-3);
  align-items: end;
  text-align: left;
}

.create-note-form label {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  font-weight: 700;
}

.create-note-form input {
  min-width: 0;
  min-height: 38px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: var(--color-surface-inset);
  box-shadow: var(--shadow-inset);
  color: var(--color-text-primary);
  padding: 0 var(--space-3);
}

.create-note-form input:focus {
  border-color: var(--color-blue-focus);
  outline: none;
}

.create-note-form button {
  min-height: 38px;
  border-radius: var(--radius-sm);
  background: var(--color-blue);
  box-shadow: var(--shadow-raised-sm);
  color: white;
  font-size: 0.88rem;
  font-weight: 800;
  padding: 0 var(--space-4);
}

.create-note-form button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.create-note-form__error {
  grid-column: 1 / -1;
  margin: 0;
  border-radius: var(--radius-sm);
  background: var(--color-red-soft);
  color: var(--color-red);
  font-size: 0.82rem;
  padding: var(--space-2) var(--space-3);
}

@media (width < 900px) {
  .create-note-form {
    grid-template-columns: 1fr;
  }
}
</style>
