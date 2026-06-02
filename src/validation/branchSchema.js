import * as yup from 'yup';

export const branchSchema = yup.object().shape({
  name: yup.string().required('Branch name is required'),
  address: yup.string(),
  email: yup.string().email('Invalid email'),
  phone: yup.string(),
  managerName: yup.string(),
  status: yup.string().required(),
});
