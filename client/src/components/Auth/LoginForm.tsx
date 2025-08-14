import React from "react"
import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack, Heading, Text, Link } from "@chakra-ui/react"
import { Formik, Form, Field } from "formik"
import * as Yup from "yup"

interface Values {
  email: string
  password: string
}

export function LoginForm({ mode = "login", onSuccess }: { mode?: "login" | "signup"; onSuccess?: (token: string) => void }) {
  const [currentMode, setCurrentMode] = React.useState<"login" | "signup">(mode)

  const Schema = Yup.object({
    email: Yup.string().email("Invalid email").required("Required"),
    password: Yup.string().min(6, "Min 6 characters").required("Required"),
  })

  async function submit(values: Values, { setSubmitting, setStatus }: any) {
    setStatus(undefined)
    try {
      const res = await fetch(`/api/auth/${currentMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      onSuccess?.(data.token)
    } catch (err: any) {
      setStatus(err?.message || "Failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack spacing={6} maxW="md" mx="auto" p={6} borderWidth="1px" borderRadius="lg" bg="white">
      <Heading size="md" textAlign="center">
        {currentMode === "login" ? "Log in to AlgoFinny" : "Create your AlgoFinny account"}
      </Heading>
      <Formik initialValues={{ email: "", password: "" }} validationSchema={Schema} onSubmit={submit}>
        {({ isSubmitting, status }) => (
          <Form>
            <Stack spacing={4}>
              <Field name="email">
                {({ field, form }: any) => (
                  <FormControl isInvalid={form.errors.email && form.touched.email}>
                    <FormLabel>Email</FormLabel>
                    <Input {...field} type="email" placeholder="you@example.com" />
                    <FormErrorMessage>{form.errors.email}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Field name="password">
                {({ field, form }: any) => (
                  <FormControl isInvalid={form.errors.password && form.touched.password}>
                    <FormLabel>Password</FormLabel>
                    <Input {...field} type="password" placeholder="••••••••" />
                    <FormErrorMessage>{form.errors.password}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              {status && (
                <Text color="red.500" fontSize="sm">
                  {status}
                </Text>
              )}
              <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
                {currentMode === "login" ? "Login" : "Sign Up"}
              </Button>
              <Text fontSize="sm" textAlign="center">
                {currentMode === "login" ? "No account? " : "Have an account? "}
                <Link onClick={() => setCurrentMode(currentMode === "login" ? "signup" : "login")} color="blue.500">
                  {currentMode === "login" ? "Sign up" : "Log in"}
                </Link>
              </Text>
            </Stack>
          </Form>
        )}
      </Formik>
    </Stack>
  )
}

export default LoginForm
