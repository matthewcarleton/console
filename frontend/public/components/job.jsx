import React from 'react';

import {angulars} from './react-wrapper';
import {makeDetailsPage, makeListPage, makeList} from './factory';
import {Cog, LabelList, ResourceLink, Selector, Timestamp, navFactory} from './utils';

const Header = () => <div className="row co-m-table-grid__head">
  <div className="col-lg-2 col-md-2 col-sm-3 col-xs-6">Name</div>
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">Labels</div>
  <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">Completions</div>
  <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">Type</div>
  <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">Pod Selector</div>
</div>;

const JobCog = ({job}) => {
  const kind = angulars.kinds.JOB;
  const {factory: {Delete, ModifyLabels, ModifyJobParallelism, ModifyPodSelector}} = Cog;
  const options = [ModifyJobParallelism, ModifyPodSelector, ModifyLabels, Delete].map(f => f(kind, job));
  return <Cog options={options} />;
};

const getJobTypeAndCompletions = (o) => {
  // if neither completions nor parallelism are defined, then it is a non-parallel job.
  if (!o.spec.completions && !o.spec.parallelism) {
    return {type: 'Non-parallel', completions: 1};
  }
  // if completions are defined and no parallelism is defined, or if parallelism is 0 or 1, then it is a 'Non-parallel' job.
  if (o.spec.completions && (!o.spec.parallelism || o.spec.parallelism === 1)) {
    return {type: 'Non-parallel', completions: o.spec.completions};
  }
  // if parallelism is greater than 1 and completions are defined, then it is a 'Fixed Completion Count' job.
  if (o.spec.hasOwnProperty('parallelism') && o.spec.completions) {
    return {type: 'Fixed Completion Count', completions: o.spec.completions};
  }
  // otherwise, if parallelism is defined, but completions is not, then it is a 'Work Queue' job.
  return {type: 'Work Queue', completions: 1};
};

const JobRow = ({obj: job}) => {
  const {type, completions} = getJobTypeAndCompletions(job);
  return (
    <div className="row co-resource-list__item">
      <div className="col-lg-2 col-md-2 col-sm-3 col-xs-6">
        <JobCog job={job} />
        <ResourceLink kind="job" name={job.metadata.name} namespace={job.metadata.namespace} title={job.metadata.uid} />
      </div>
      <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">
        <LabelList kind="job" labels={job.metadata.labels} />
      </div>
      <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">
        <a href={`ns/${job.metadata.namespace}/jobs/${job.metadata.name}/pods`} title="pods">
          {job.status.succeeded || 0} of {completions}
        </a>
      </div>
      <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">
        {type}
      </div>
      <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">
        <Selector selector={job.spec.selector} />
      </div>
    </div>
  );
};

const Details = (job) => <div>
  <div className="row no-gutter">
    <div className="col-md-6">
      <div className="co-m-pane__heading">
        <h1 className="co-m-pane__title">Job Overview</h1>
      </div>
      <div className="co-m-pane__body-group">
        <div className="co-m-pane__body-section--bordered">
          <dl>
            <dt>Name</dt>
            <dd>{job.metadata.name || '-'}</dd>
            <dt>Labels</dt>
            <dd><LabelList kind="job" labels={job.metadata.labels} /></dd>
            <dt>Pod Selector</dt>
            <dd><Selector selector={job.spec.selector.matchLabels} expand={true} /></dd>
            <dt>Created At</dt>
            <dd><Timestamp timestamp={job.metadata.creationTimestamp} /></dd>
            <dt>Desired Completions</dt>
            <dd>{job.spec.completions || '-'}</dd>
            <dt>Parallelism</dt>
            <dd>{job.spec.parallelism || '-'}</dd>
            <dt>Deadline</dt>
            <dd>{job.spec.activeDeadlineSeconds ? `${job.spec.activeDeadlineSeconds} seconds` : '-'}</dd>
          </dl>
        </div>
      </div>
    </div>
    <div className="col-md-6">
      <div className="co-m-pane__heading">
        <h1 className="co-m-pane__title">Job Status</h1>
      </div>
      <div className="co-m-pane__body-group">
        <div className="co-m-pane__body-section--bordered">
          <dl>
            <dt>Status</dt>
            <dd>{job.status.conditions ? job.status.conditions[0].type : 'In Progress'}</dd>
            <dt>Start Time</dt>
            <dd><Timestamp timestamp={job.status.startTime} /></dd>
            <dt>Completion Time</dt>
            <dd><Timestamp timestamp={job.status.completionTime} /></dd>
            <dt>Succeeded Pods</dt>
            <dd>{job.status.succeeded || 0}</dd>
            <dt>Active Pods</dt>
            <dd>{job.status.active || 0}</dd>
            <dt>Failed Pods</dt>
            <dd>{job.status.failed || 0}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
</div>;

const {details, pods, editYaml} = navFactory;
const pages = [details(Details), editYaml(), pods()];
const JobsDetailsPage = makeDetailsPage('JobsDetailsPage', 'job', pages);
const JobsList = makeList('Jobs', 'job', Header, JobRow);
const JobsPage = makeListPage('JobsPage', 'job', JobsList);
export {JobsList, JobsPage, JobsDetailsPage};
