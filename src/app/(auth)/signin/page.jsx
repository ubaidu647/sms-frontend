"use client";
import React from "react";
import SignInForm from "./SignInForm";

const SignInPage = () => {

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 ">
      <div className="min-h-screen lg:px-[6rem] lg:py-[5rem] py-[2rem] xl:!rounded-r-lg flex justify-center">
        <div className="max-w-screen flex justify-center flex-1">

          <div className="flex-1 bg-indigo-100 text-center hidden lg:flex rounded-l-lg">
            <div className="m-12 xl:m-16 w-full bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: "url('https://storage.googleapis.com/devitary-image-host.appspot.com/15848031292911696601-undraw_designer_life_w96d.svg')" }}>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-10 rounded-lg  lg:w-1/2 xl:w-5/12 lg:px-[6rem] xl:px-[8rem] lg:rounded-r-lg lg:rounded-l-none">
            <div>
              <img src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" alt="Your Company" className="h-10 w-auto mt-[3rem]" />
              <header className="font-bold text-black dark:text-gray-100 pt-[0rem] pb-[1rem] " >Sign in to your account</header>

            </div>
            <div>
              <SignInForm />
            </div>

            {/* <form onSubmit={handleSubmit(onSubmit)}>
              <div>
                <Input
                  label="Enter your email"
                  name="email"
                  type="email"
                  placeholder=""
                  watch={watch}
                  errors={errors}
                  register={register}

                />
              </div>
              <div>
                <Input
                  label="Enter your Password"
                  name="password"
                  type="password"
                  placeholder=""
                  watch={watch}
                  errors={errors}
                  register={register}

                />

                <div className="text-right mt-2">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
              <div className="mt-[2rem] flex items-center justify-center">
                <Button
                  styleObject={{ baseColor: "bg-black", hoverColor: "hover:bg-gray-800", animation: "transform transition-all duration-500 ease-in-out transform origin-center", rounded: "rounded-full", size: "px-10 py-1 text-md  min-h-[2.5rem]", textColor: "text-white" }} loading={isSubmitting} success={isSubmitSuccessful} handleClick={handleSubmit}>
                  Login
                </Button>
              </div>
            </form> */}
          </div>


        </div>
      </div>
    </div>


  )
}


export default SignInPage;
