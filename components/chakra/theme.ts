"use client"

import { extendTheme, type ThemeConfig } from "@chakra-ui/react"

const config: ThemeConfig = {
  initialColorMode: "system",
  useSystemColorMode: true,
}

export const customTheme = extendTheme({
  config,
  colors: {
    purple: {
      50: "#F2EBFF",
      100: "#E6D7FF",
      200: "#CDB0FF",
      300: "#B48AFF",
      400: "#9B63F2",
      500: "#805AD5", // primary
      600: "#6C46C0",
      700: "#5737A3",
      800: "#40287D",
      900: "#2B1B57",
    },
    gray: {
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
      700: "#374151",
      800: "#1F2937",
      900: "#111827",
    },
  },
  components: {
    Button: {
      baseStyle: {
        rounded: "md",
      },
      defaultProps: {
        colorScheme: "purple",
      },
    },
    Badge: {
      defaultProps: {
        colorScheme: "purple",
      },
    },
    Progress: {
      baseStyle: {
        filledTrack: {
          bg: "purple.500",
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: { base: "white", _dark: "gray.900" },
      },
    },
  },
})
