<?php

/**
 * Create the item update job.
 */
class CreateUpdateItemTask extends BuildTask {

	public function getDescription() {
		return _t(
			'CreateUpdateItemTask.Description',
			'A task used to create a queued job for the UpdateItemJob'
		);
	}
	
    public function run($request) {
		$job = new UpdateItemJob;

		echo "Job Queued";
		singleton('QueuedJobService')->queueJob($job);
	}
}