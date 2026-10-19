import SignInAuthForm from "@src/components/auth-components/SignInAuthForm";
import AppLoader from "@src/components/ui/AppLoader";
import React, { Suspense } from "react";

function SignIn() {
  return (
    <div>
      <Suspense fallback={<AppLoader label="Loading sign in" className="min-h-[18rem]" />}>
        <SignInAuthForm />
      </Suspense>
    </div>
  );
}

export default SignIn;
