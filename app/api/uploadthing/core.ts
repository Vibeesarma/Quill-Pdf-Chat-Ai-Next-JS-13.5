import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { pinecone } from "@/lib/pinecone";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { PLANS } from "@/config/stripe";

const f = createUploadthing();

const middleware = async () => {
  // Whatever is returned here is accessible in onUploadComplete as `metadata`

  const { getUser } = getKindeServerSession();
  const user = getUser();

  if (!user || !user.id) {
    throw new Error("Unauthorized");
  }

  const subscriptionPlan = await getUserSubscriptionPlan();

  return { subscriptionPlan, userId: user.id };
};

const onUploadComplete = async ({
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>;
  file: {
    key: string;
    name: string;
    url: string;
  };
}) => {
  const isFileExist = await db.file.findFirst({
    where: {
      key: file.key,
    },
  });

  if (isFileExist) return;

  // This code RUNS ON YOUR SERVER after upload
  console.log("Upload complete for userId:", metadata);
  const createdFile = await db.file.create({
    data: {
      key: file.key,
      name: file.name,
      userId: metadata.userId,
      url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
      uploadStatus: "PROCESSING",
    },
  });

  console.log("file url", file.url);

  try {
    const response = await fetch(
      `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`
    );

    const blob = await response.blob();
    const loader = new PDFLoader(blob);

    const pageLevelDocs = await loader.load();
    const pagesAmt = pageLevelDocs.length;

    const {
      subscriptionPlan: { isSubscribed },
    } = metadata;

    const isProExceed =
      pagesAmt > PLANS.find((plan) => plan.name === "Pro")!.pagesPerPdf;
    const isFreeExceed =
      pagesAmt > PLANS.find((plan) => plan.name === "Free")!.pagesPerPdf;

    if ((isSubscribed && isProExceed) || (!isSubscribed && isFreeExceed)) {
      await db.file.update({
        data: {
          uploadStatus: "FAILED",
        },
        where: {
          id: createdFile.id,
        },
      });
    }

    // vectorized and index entire document
    const pineconeIndex = pinecone.Index("quillpdfchatyt");

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPEN_AI_KEY,
    });

    // NOTE:the name space properties does not supported for free tier
    await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
      pineconeIndex,
      // namespace: createdFile.id,
    });

    await db.file.update({
      where: {
        id: createdFile.id,
      },
      data: {
        uploadStatus: "SUCCESS",
      },
    });
  } catch (error) {
    console.log("🚀 ~ file: core.ts:76 ~ .onUploadComplete ~ error:", error);
    await db.file.update({
      where: {
        id: createdFile.id,
      },
      data: {
        uploadStatus: "FAILED",
      },
    });
  }
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  freePlanUploader: f({ pdf: { maxFileSize: "4MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),

  proPlanUploader: f({ pdf: { maxFileSize: "16MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
