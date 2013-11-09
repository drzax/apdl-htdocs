<?php

/**
 * Create the item update job.
 */
class CreateUpdateFriendsTask extends BuildTask {

	public function getDescription() {
		return 'A task used to create a queued job for the UpdateFriendsJob';
	}
	
    public function run($request) {
		$job = new UpdateFriendsJob;

		echo "Job Queued";
		singleton('QueuedJobService')->queueJob($job);
	}
}