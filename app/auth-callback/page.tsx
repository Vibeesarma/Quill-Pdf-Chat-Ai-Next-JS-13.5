"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { trpc } from "../_trpc/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const router = useRouter();

  const searchParams = useSearchParams();
  const orgin = searchParams.get("origin");

  trpc.authCallback.useQuery(undefined, {
    onSuccess: ({ success }) => {
      if (success) {
        // user sync to database
        router.push(orgin ? `/${orgin}` : "/dashboard");
      }
    },

    onError: (err) => {
      if (err.data?.code === "UNAUTHORIZED") {
        router.push("/sign-in");
      }
    },
    retry: true,
    retryDelay: 500,
  });

  return (
    <div className="w-full mt-24 flex justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className=" h-8 w-8 animate-spin text-zinc-800" />
        <h3 className="font-semibold text-xl">Setting up your account...</h3>
      </div>
    </div>
  );
};

export default AuthCallback;
