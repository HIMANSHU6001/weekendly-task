"use client";

import {auth} from "@/lib/firebase";
import {GoogleAuthProvider, signInWithPopup} from "firebase/auth";
import {Button} from "@/components/ui/button";
import Logo from "@/public/icons/Logo";
import React from "react";
import Image from "next/image";

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
        <Logo className='h-13 w-13'/>
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
          <Image src='/icons/google.svg' alt='Google Logo' width={18} height={18} className="mr-2"/>
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
