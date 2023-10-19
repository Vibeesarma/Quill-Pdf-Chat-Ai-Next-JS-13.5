# Quill Pdf Reader AI in Next.js 13.5.3

![image](https://github.com/Vibeesarma/Breadit-Clone-Next-JS-13.4/assets/77588716/7768f1a2-0a18-4784-b628-73ed637bde89)

> This project get from [Josh tried coding](https://www.youtube.com/@joshtriedcoding) YouTube channel

> Project Link [Build a Complete SaaS Platform with Next.js 13, React, Prisma, tRPC, Tailwind | Full Course 2023](https://youtu.be/ucX2zXAZ1I0?si=I_OUkHO6cwixcq1a)

## Lucide

- [Lucide](https://lucide.dev/) is an icon library used for shadcn/ui.

## shadcn/ui

- [shadcn](https://ui.shadcn.com/) is designed components that you can copy and paste into your apps.
- you can also install components using `npx` command.


## Kinde

- [Kinde](https://kinde.com/) is a platform use for login and signup
- Just create a account and choose the platform that you use for this project and install the dependence `npm i @kinde-oss/kinde-auth-nextjs`
- copy the env past it your env file
- create end api end point on `src/app/api/auth/[kindeAuth]/route.js`

```typescript
import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET(request, { params }) {
  const endpoint = params.kindeAuth;
  return handleAuth(request, endpoint);
}
```

- Just add a button like below it will handle other things.

```typescript
import {RegisterLink, LoginLink} from "@kinde-oss/kinde-auth-nextjs/server";

<LoginLink>Sign in</LoginLink>

<RegisterLink>Sign up</RegisterLink>


```



> Thanks for [Josh tried coding](https://www.youtube.com/@joshtriedcoding).
