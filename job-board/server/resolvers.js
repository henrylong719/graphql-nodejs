const db = require('./db');

const Query = {
  company: (parent, { id }) => db.companies.get(id),
  job: (parent, args) => db.jobs.get(args.id),
  jobs: () => db.jobs.list(),
};

const Mutation = {
  createJob: (root, { input }, context) => {
    if (!context.user) {
      throw new Error('Unauthorized');
    }

    console.log(context.user);
    const id = db.jobs.create({ ...input, companyId: context.user.companyId });
    return db.jobs.get(id);
  },
};

const Job = {
  company: (job) => db.companies.get(job.companyId),
};

const Company = {
  jobs: (company) =>
    db.jobs.list().filter((job) => job.companyId === company.id),
};

module.exports = { Query, Mutation, Job, Company };
