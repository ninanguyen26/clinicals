import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useSignUp } from "@clerk/clerk-expo";
import { authStyles } from "../../assets/styles/auth.styles";

export default function SignupScreen() {
    const router = useRouter();
    const { signUp, setActive, isLoaded } = useSignUp();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSignUp = async () => {
        if (!isLoaded || loading) return;

        setErrorMsg("");
        setLoading(true);

        try {
            const result = await signUp.create({
                emailAddress: email.trim(),
                password,
            });

            // Clerk email verification is disabled for now
            if (result.status !== "complete") {
                setErrorMsg(
                "Signup is not complete. Disable email verification in Clerk or you must add a verify screen."
                );
                return;
            }

            await setActive({ session: result.createdSessionId });
            router.replace("/(tabs)");
        } catch (err: any) {
            const msg =
                err?.errors?.[0]?.longMessage ||
                err?.errors?.[0]?.message ||
                "Sign up failed.";
            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={authStyles.container}>
            <KeyboardAvoidingView
                style={authStyles.keyboardView}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    contentContainerStyle={authStyles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={authStyles.imageContainer}>
                        <Image
                            source={require("../../assets/images/signup.jpg")}
                            style={authStyles.image}
                        />
                    </View>
                    
                    <Text style={authStyles.title}>Sign Up</Text>
                    <Text style={authStyles.subtitle}>Create your account.</Text>

                    {!!errorMsg && <Text style={authStyles.errorText}>{errorMsg}</Text>}

                    <View style={authStyles.inputContainer}>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Email"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            style={authStyles.textInput}
                        />
                    </View>

                    <View style={authStyles.inputContainer}>
                        <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        secureTextEntry={!showPassword}
                        style={authStyles.textInput}
                        />

                        <TouchableOpacity
                        style={authStyles.eyeButton}
                        onPress={() => setShowPassword((v) => !v)}
                        hitSlop={10}
                        activeOpacity={0.8}
                        >
                        <Text style={authStyles.eyeText}>
                            {showPassword ? "Hide" : "Show"}
                        </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                        authStyles.authButton,
                        (!isLoaded || loading) && authStyles.buttonDisabled,
                        ]}
                        activeOpacity={0.8}
                        disabled={!isLoaded || loading}
                        onPress={handleSignUp}
                    >
                        <Text style={authStyles.buttonText}>
                        {loading ? "Creating..." : "Create Account"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={authStyles.linkContainer}
                        activeOpacity={0.8}
                        onPress={() => router.push("/signin")}
                    >
                        <Text style={authStyles.linkText}>
                        Already have an account?{" "}
                        <Text style={authStyles.link}>Sign In</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
