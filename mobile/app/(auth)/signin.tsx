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
import { useAuth, useSignIn } from "@clerk/clerk-expo";
import { useEffect } from "react";
import { authStyles } from "../../assets/styles/auth.styles";

export default function SigninScreen() {
    const router = useRouter();
    const { isLoaded: authLoaded, isSignedIn } = useAuth();
    const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    
    // if already signed in
    useEffect(() => {
        if (!authLoaded) return;
        if (isSignedIn) router.replace("/cases");
    }, [authLoaded, isSignedIn, router]);

    // while Clerk is loading or redirecting
    if (!authLoaded || isSignedIn) {
        return null;
    }

    const handleSignIn = async () => {
        if (!signInLoaded || loading) return;

        setErrorMsg("");
        setLoading(true);

        try {
        const result = await signIn.create({
            identifier: email.trim(),
            password,
        });

        if (result.status !== "complete") {
            setErrorMsg("Err.");
            return;
        }

        await setActive({ session: result.createdSessionId });
        router.replace("/cases");
        } catch (err: any) {
        const msg =
            err?.errors?.[0]?.longMessage ||
            err?.errors?.[0]?.message ||
            "Sign in failed.";
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
                        source={require("../../assets/images/signin.jpg")}
                        style={authStyles.image}
                    />
                </View>
        
                <Text style={authStyles.title}>Sign In</Text>
                <Text style={authStyles.subtitle}>Welcome back.</Text>

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
                        (!signInLoaded || loading) && authStyles.buttonDisabled,
                    ]}
                    activeOpacity={0.8}
                    disabled={!signInLoaded || loading}
                    onPress={handleSignIn}
                >
                    <Text style={authStyles.buttonText}>
                        {loading ? "Signing in..." : "Sign In"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={authStyles.linkContainer}
                    activeOpacity={0.8}
                    onPress={() => router.push("/signup")}
                >
                    <Text style={authStyles.linkText}>
                    New here? <Text style={authStyles.link}>Create an account</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
        </View>
    );
}
