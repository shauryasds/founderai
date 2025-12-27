"use client";

import { trackGuestUsage } from "@/lib/trackUsage";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

type ValidatedData = {
    shortAnswer: string;
    detailedDescription: string;
    score: number;
};


export default function IdeaInput() {
    const [idea, setIdea] = useState("Explain your Startup Idea, And Check If Its Unique With Realtime Search");
    const [disabled, setIsDisabled] = useState(false);
    const [result, setResult] = useState<ValidatedData | null>(null);

    async function submit() {

        if (idea === "Explain your Startup Idea, And Check If Its Unique With Realtime Search") {
            toast.error("Please enter your idea before submitting.");
            return;
        }
        if (disabled) return;

        // return;
        const supabase = createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        // console.log("User:", user);
        // return;
        // if (!user) {
        //     const allowed = trackGuestUsage();
        //     if (!allowed) return;
        // }


        setIsDisabled(true);
        setResult(null); // clear previous result if any

        try {
            const res = await fetch("/api/validate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ input: idea }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong. Please try again.");
            }
            console.log("Validation result:", data);

            console.log("Validation result:", data.validatedData);
            setResult(data.validatedData);
            toast.success("Validation successful!");

        } catch (e: unknown) {
            if (e instanceof Error) {
                toast.error(e.message);
            } else {
                toast.error("An unknown error occurred");
            }
        } finally {
            setIsDisabled(false);
        }

    }
    return (
        <section className="w-full bg-soft rounded-2xl p-6">
            <textarea
                rows={6}
                placeholder="Describe Your Idea: e.g. I propose a mobile app that connects eco-conscious travelers with sustainable accommodations..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                maxLength={650}
                className="w-full bg-dark border border-gray-700 text-white rounded-xl p-4 resize-none"
            />
            <div className="text-right mt-1 text-sm text-red-400">
                {idea.length}/650
            </div>
            <div className="w-full text-center mt-6">
                <button
                    onClick={submit}
                    disabled={disabled}
                    className={`px-6 py-3 rounded-full text-md font-semibold transition-all duration-300 shadow-md ${disabled
                        ? "bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-500 animate-pulse text-white"
                        : "bg-white text-black hover:bg-purple-200"
                        }`}
                >
                    {disabled ? "Evaluating..." : "Evaluate now"}
                </button>
            </div>

            {/* Show result */}
            {result && (
                <div className="mt-10 bg-dark text-white rounded-xl border border-violet-700 p-6">
                    <h2 className="text-lg font-bold mb-2">🧠 Idea Analysis Result</h2>
                    <p className="mb-2">
                        <strong>Short Answer:</strong> {result.shortAnswer}
                    </p>
                    <p className="mb-2">
                        <strong>Uniqueness Score:</strong> {result.score}/100
                    </p>
                    <p className="mb-2">
                        <strong>Details:</strong> {result.detailedDescription}
                    </p>
                </div>
            )}
        </section>
    );
}
