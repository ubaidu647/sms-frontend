'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { signInSchema } from './validation';
import { useSignIn } from './hooks/useSignIn';
import Input from '@/component/InputField';
import Button from '@/component/Button';
import Link from 'next/link';

const SignInForm = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(signInSchema),
  });

  const { mutate, isPending, isSuccess } = useSignIn();

  const onSubmit = (data) => mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Enter your email"
        name="email"
        type="email"
        placeholder=""
        watch={watch}
        errors={errors}
        register={register}
      />

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

      <div className="mt-[2rem] flex items-center justify-center">
        <Button
          type="submit"
          styleObject={{
            baseColor: 'bg-black',
            hoverColor: 'hover:bg-gray-800',
            animation: 'transform transition-all duration-500 ease-in-out transform origin-center',
            rounded: 'rounded-full',
            size: 'px-10 py-1 text-md  min-h-[2.5rem]',
            textColor: 'text-white',
          }}
          loading={isPending}
          success={isSuccess}
        >
          Login
        </Button>
      </div>

      {/* {error && <p className="text-red-500 mt-2">{error.message}</p>} */}
    </form>
  );
};

export default SignInForm;
