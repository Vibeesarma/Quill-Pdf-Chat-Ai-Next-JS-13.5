import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

const DashBoard = () => {
  const { getUser } = getKindeServerSession();
  const user = getUser();

  if (!user || !user.id) {
    redirect("/auth-callback?orgin=dashboard");
  }

  return <div>{user.email}</div>;
};

export default DashBoard;
