import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import React from "react";
import DashBoardComponent from "@/components/DashBoard";
import { getUserSubscriptionPlan } from "@/lib/stripe";

const DashBoard = async () => {
  const { getUser } = getKindeServerSession();
  const user = getUser();

  if (!user || !user.id) {
    redirect("/auth-callback?orgin=dashboard");
  }

  const dbUser = await db.user.findFirst({ where: { id: user.id } });

  const subscriptionPlan = await getUserSubscriptionPlan();

  if (!dbUser) redirect("/auth-callback?orgin=dashboard");

  return <DashBoardComponent subscriptionPlan={subscriptionPlan} />;
};

export default DashBoard;
