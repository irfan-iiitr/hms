"use client"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()

  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-2 rounded-md border bg-background/90 p-1 shadow-sm backdrop-blur">
      <Button
        type="button"
        variant={language === "en" ? "default" : "ghost"}
        size="sm"
        onClick={() => setLanguage("en")}
      >
        {t("lang.english", "English")}
      </Button>
      <Button
        type="button"
        variant={language === "hi" ? "default" : "ghost"}
        size="sm"
        onClick={() => setLanguage("hi")}
      >
        {t("lang.hindi", "Hindi")}
      </Button>
    </div>
  )
}
