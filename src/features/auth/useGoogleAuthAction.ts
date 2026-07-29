import { ref } from "vue";
import { signInWithGoogle } from "@/features/auth/googleAuth";
import { useLocalizedRoute } from "@/utils/utils";

export const useGoogleAuthAction = () => {
  const routePush = useLocalizedRoute();
  const errorMessage = ref("");

  const runGoogleAuth = async () => {
    errorMessage.value = "";
    const result = await signInWithGoogle();
    if (result.ok) {
      routePush("/");
      return;
    }

    errorMessage.value = result.error?.message ?? "Google認証に失敗しました。";
  };

  return {
    errorMessage,
    runGoogleAuth,
  };
};
