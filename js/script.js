function main(){

	styleSetup_dm();
	sliderSetup_dm();
	mweloSetup_dm();
	tsSetup_dm(vizState_dm.agencyID, vizState_dm.agencyName);
	mapSetup_dm();
	// summarySentence_dm(vizState_dm.agencyName, vizState_dm.usageDifference, vizState_dm.mwelo, vizState_dm.startDate, vizState_dm.endDate);
}