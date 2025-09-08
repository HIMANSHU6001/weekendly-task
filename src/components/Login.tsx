"use client";

import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Waves } from "lucide-react";

export function Login() {
    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error during Google sign-in:", error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <div className="flex items-center gap-4 mb-8">
                <Waves className="h-12 w-12 text-primary" />
                <h1 className="text-5xl font-bold text-primary">Weekendly</h1>
            </div>
            <p className="text-lg text-muted-foreground mb-8">
                Your personal weekend planner.
            </p>
            <div className="p-8 border rounded-lg shadow-lg bg-card max-w-sm w-full">
                <h2 className="text-xl font-semibold text-center mb-6">
                    Sign in to get started
                </h2>
                <Button
                    onClick={handleGoogleSignIn}
                    className="w-full"
                    variant="outline"
                >
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5c-20.3-19.1-49.4-30.6-82-30.6-62.5 0-113.5 51.6-113.5 115.3s51 115.3 113.5 115.3c71.2 0 98.2-53.2 102.7-77.9H248V261.8h239.2z"></path></svg>
                    Sign in with Google
                </Button>
            </div>
        </div>
    );
}
