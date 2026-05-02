"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

type Language = "en" | "hi"

type Dictionary = Record<string, string>

const dictionaries: Record<Language, Dictionary> = {
  en: {
    "lang.english": "English",
    "lang.hindi": "Hindi",
    "home.tagline": "AI-Powered Healthcare Management Portal",
    "home.selectRole": "Select your role to get started",
    "home.patientLogin": "Patient Login",
    "home.doctorLogin": "Doctor Login",
    "home.adminLogin": "Admin Login",
    "home.newUser": "New user?",
    "home.createAccount": "Create Account",
    "login.title": "Login",
    "login.signInAs": "Sign in as {role}",
    "login.email": "Email",
    "login.password": "Password",
    "login.signIn": "Sign In",
    "login.signingIn": "Signing in...",
    "login.noAccount": "Don't have an account?",
    "login.signup": "Sign up",
    "signup.title": "Create Account",
    "signup.subtitle": "Join HealthFlow and manage your healthcare",
    "signup.fullName": "Full Name",
    "signup.fullNamePlaceholder": "Enter your full name",
    "signup.email": "Email",
    "signup.emailPlaceholder": "Enter your email",
    "signup.password": "Password",
    "signup.passwordPlaceholder": "Create a password",
    "signup.role": "Role",
    "signup.patient": "Patient",
    "signup.doctor": "Doctor",
    "signup.admin": "Admin",
    "signup.create": "Create Account",
    "signup.creating": "Creating Account...",
    "signup.haveAccount": "Already have an account?",
    "signup.signIn": "Sign in",
    "signup.backHome": "Back to Home",
  },
  hi: {
    "lang.english": "अंग्रेज़ी",
    "lang.hindi": "हिंदी",
    "home.tagline": "AI-सहायित स्वास्थ्य प्रबंधन पोर्टल",
    "home.selectRole": "शुरू करने के लिए अपनी भूमिका चुनें",
    "home.patientLogin": "रोगी लॉगिन",
    "home.doctorLogin": "डॉक्टर लॉगिन",
    "home.adminLogin": "एडमिन लॉगिन",
    "home.newUser": "नए उपयोगकर्ता?",
    "home.createAccount": "खाता बनाएं",
    "login.title": "लॉगिन",
    "login.signInAs": "{role} के रूप में साइन इन करें",
    "login.email": "ईमेल",
    "login.password": "पासवर्ड",
    "login.signIn": "साइन इन",
    "login.signingIn": "साइन इन हो रहा है...",
    "login.noAccount": "क्या आपका खाता नहीं है?",
    "login.signup": "साइन अप करें",
    "signup.title": "खाता बनाएं",
    "signup.subtitle": "HealthFlow से जुड़ें और अपना स्वास्थ्य प्रबंधन करें",
    "signup.fullName": "पूरा नाम",
    "signup.fullNamePlaceholder": "अपना पूरा नाम दर्ज करें",
    "signup.email": "ईमेल",
    "signup.emailPlaceholder": "अपना ईमेल दर्ज करें",
    "signup.password": "पासवर्ड",
    "signup.passwordPlaceholder": "पासवर्ड बनाएं",
    "signup.role": "भूमिका",
    "signup.patient": "रोगी",
    "signup.doctor": "डॉक्टर",
    "signup.admin": "एडमिन",
    "signup.create": "खाता बनाएं",
    "signup.creating": "खाता बनाया जा रहा है...",
    "signup.haveAccount": "क्या आपका पहले से खाता है?",
    "signup.signIn": "साइन इन करें",
    "signup.backHome": "होम पर वापस जाएं",
  },
}

type I18nContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, fallback?: string, vars?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")

  useEffect(() => {
    const stored = window.localStorage.getItem("language")
    if (stored === "en" || stored === "hi") {
      setLanguageState(stored)
      document.documentElement.lang = stored
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    window.localStorage.setItem("language", lang)
    document.documentElement.lang = lang
  }

  const value = useMemo<I18nContextType>(
    () => ({
      language,
      setLanguage,
      t: (key, fallback = key, vars) => {
        const raw = dictionaries[language][key] ?? fallback
        if (!vars) return raw
        return Object.entries(vars).reduce((out, [name, replacement]) => {
          return out.replaceAll(`{${name}}`, replacement)
        }, raw)
      },
    }),
    [language],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider")
  }
  return context
}
