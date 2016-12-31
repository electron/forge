import opn from 'opn';

export default async (filePath) => {
  await opn(filePath, { wait: false });
};
