import * as yup from "yup";

export const signInSchema = yup.object({
    email: yup.string().required("Email is required").email("Invalid email"),
    password: yup
        .string()
        .required("Password is required")
        .trim()
        .min(3, "Password must be at least 3 characters"),
});
