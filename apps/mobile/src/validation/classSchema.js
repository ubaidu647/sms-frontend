import * as yup from 'yup';
import { GRADES, CLASS_TYPES, MEDIUMS } from '../constants/classes';

export const createClassSchema = yup.object().shape({
  name: yup.string().required('Class name is required'),
  grade: yup
    .string()
    .oneOf(GRADES, 'Select a grade')
    .required('Grade is required'),
  classType: yup
    .string()
    .oneOf(CLASS_TYPES, 'Select a class type')
    .required('Class type is required'),
  academicYear: yup
    .string()
    .matches(/^\d{4}-\d{4}$/, 'Format must be YYYY-YYYY')
    .required('Academic year is required'),
  medium: yup.string().oneOf([...MEDIUMS, ''], 'Pick a medium').optional(),
  classTeacher: yup.string().optional(),
  totalCapacity: yup
    .number()
    .nullable()
    .transform((v, o) => (o === '' ? null : v))
    .optional(),
  status: yup.string().optional(),
  branchId: yup.string().optional(),
});

export const editClassSchema = yup.object().shape({
  name: yup.string().optional(),
  classType: yup.string().optional(),
  medium: yup.string().optional(),
  classTeacher: yup.string().optional(),
  totalCapacity: yup
    .number()
    .nullable()
    .transform((v, o) => (o === '' ? null : v))
    .optional(),
  status: yup.string().optional(),
});

export const createSectionSchema = yup.object().shape({
  name: yup.string().required('Section name is required'),
  academicYear: yup
    .string()
    .matches(/^\d{4}-\d{4}$/, 'Format must be YYYY-YYYY')
    .required('Academic year is required'),
  capacity: yup
    .number()
    .typeError('Capacity must be a number')
    .min(1, 'Capacity must be at least 1')
    .required('Capacity is required'),
  classTeacher: yup.string().optional(),
  status: yup.string().optional(),
});

export const editSectionSchema = yup.object().shape({
  name: yup.string().optional(),
  capacity: yup
    .number()
    .nullable()
    .transform((v, o) => (o === '' ? null : v))
    .min(1, 'Capacity must be at least 1')
    .optional(),
  classTeacher: yup.string().optional(),
  status: yup.string().optional(),
});
