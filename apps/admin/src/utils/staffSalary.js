// The API leaves `salary` out of staff records unless the caller holds a payroll
// action. null is different: the caller may see it, and none is set.
export const hasSalaryField = (record) => record?.salary !== undefined;

export const anyHasSalaryField = (records = []) => records.some(hasSalaryField);
