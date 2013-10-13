<?php

class UpdateLog extends SS_Log {
	protected static $logger;
	const INFO = Zend_Log::INFO;
}

class UpdateLogFileFormatter extends SS_LogErrorFileFormatter {

	public function format($event) {
		$errno = $event['message']['errno'];
		$errstr = $event['message']['errstr'];
		$errfile = $event['message']['errfile'];
		$errline = $event['message']['errline'];
		$errcontext = $event['message']['errcontext'];
		
		switch($event['priorityName']) {
			case 'ERR':
				$errtype = 'Error';
				break;
			case 'WARN':
				$errtype = 'Warning';
				break;
			case 'NOTICE':
				$errtype = 'Notice';
				break;
			case 'INFO':
				$errtype = 'Info';
				break;
		}

		$urlSuffix = '';
		if(isset($_SERVER['HTTP_HOST']) && $_SERVER['HTTP_HOST'] && isset($_SERVER['REQUEST_URI'])) {
			$urlSuffix = " (http://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI])";
		}

		return '[' . date('d-M-Y H:i:s') . "] $errtype: $errstr$urlSuffix" . PHP_EOL;
	}

}
