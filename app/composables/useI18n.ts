import en from "~/locales/en.json"
import cs from "~/locales/cs.json"

const messages: Record<string, Record<string, string>> = { en, cs }

export function useI18n() {
  const localeCookie = useCookie<"en" | "cs">("locale", { default: () => "cs" })
  const locale = useState<"en" | "cs">("locale", () => localeCookie.value)

  function t(key: string): string {
    return messages[locale.value]?.[key] ?? messages.en[key] ?? key
  }

  function toggleLocale() {
    locale.value = locale.value === "en" ? "cs" : "en"
    localeCookie.value = locale.value
  }

  const localeName = computed(() => locale.value === "cs" ? "Čeština" : "English")

  return { locale, t, toggleLocale, localeName }
}
