export type TranslationKey =
  | 'nav.home'
  | 'nav.groups'
  | 'nav.messages'
  | 'nav.contributions'
  | 'nav.alerts'
  | 'nav.profile'
  | 'nav.dashboard'
  | 'nav.ledger'
  | 'nav.payouts'
  | 'nav.more'
  | 'common.cancel'
  | 'common.done'
  | 'common.save'
  | 'common.create'
  | 'common.join'
  | 'common.comingSoon'
  | 'common.ok'
  | 'common.gotIt'
  | 'common.goToProfile'
  | 'common.loading'
  | 'plural.group_one'
  | 'plural.group_other'
  | 'plural.member_one'
  | 'plural.member_other'
  | 'plural.memberNoun_one'
  | 'plural.memberNoun_other'
  | 'plural.cycle_one'
  | 'plural.cycle_other'
  | 'plural.spotLeft_one'
  | 'plural.spotLeft_other'
  | 'plural.moreMember_one'
  | 'plural.moreMember_other'
  | 'plural.activeCount_one'
  | 'plural.activeCount_other'
  | 'plural.finished_one'
  | 'plural.finished_other'
  | 'plural.roster_one'
  | 'plural.roster_other'
  | 'plural.contributionPaid_one'
  | 'plural.contributionPaid_other'
  | 'plural.cyclePosition_one'
  | 'plural.cyclePosition_other'
  | 'plural.groupMeta_one'
  | 'plural.groupMeta_other'
  | 'plural.poolMembers_one'
  | 'plural.poolMembers_other'
  | 'plural.sharedGroups_one'
  | 'plural.sharedGroups_other'
  | 'plural.noSharedGroups'
  | 'group.draftTitle'
  | 'group.draftSpotsLeft'
  | 'group.draftStartWhenFull_one'
  | 'group.draftStartWhenFull_other'
  | 'group.draftOrganizerWhenFull_one'
  | 'group.draftOrganizerWhenFull_other'
  | 'group.draftWaitingAdmin_one'
  | 'group.draftWaitingAdmin_other'
  | 'group.draftRosterFull'
  | 'group.draftWaitingTitle_one'
  | 'group.draftWaitingTitle_other'
  | 'group.draftNeedMore_one'
  | 'group.draftNeedMore_other'
  | 'group.draftJoinedLine_one'
  | 'group.draftJoinedLine_other'
  | 'group.draftReadyAdmin'
  | 'group.draftReadyMember_one'
  | 'group.draftReadyMember_other'
  | 'group.draftUnlockHint_one'
  | 'group.draftUnlockHint_other'
  | 'group.membersSection'
  | 'group.previewMembers_one'
  | 'group.previewMembers_other'
  | 'group.previewFull'
  | 'group.rosterIncomplete'
  | 'group.onlyAdminStarts_one'
  | 'group.onlyAdminStarts_other'
  | 'group.cycleFinished_one'
  | 'group.cycleFinished_other'
  | 'group.cycleHistory'
  | 'group.viewFullHistory'
  | 'group.viewHistory'
  | 'group.paidOut'
  | 'group.fees'
  | 'group.fullHistoryTitle'
  | 'group.historyCycles'
  | 'group.historyPaidOut'
  | 'group.historyTotal'
  | 'group.historyFeesNote'
  | 'group.historyEmpty'
  | 'group.historyAllInOne'
  | 'group.cycleDetailTitle'
  | 'group.cycleNotFound'
  | 'group.cycleCollector'
  | 'group.cycleDue'
  | 'group.cyclePayout'
  | 'group.cycleFee'
  | 'group.cyclePaidOn'
  | 'group.cycleContributions'
  | 'group.cycleNoContributions'
  | 'group.contributionsPaid'
  | 'group.perMember'
  | 'group.you'
  | 'group.amountCollected'
  | 'group.amountWaiting'
  | 'group.detail.perDrop'
  | 'group.detail.perDropMulti'
  | 'group.detail.roster'
  | 'group.detail.turnMoney'
  | 'group.detail.turnMoneyUpTo'
  | 'group.detail.adminFeeNote'
  | 'group.detail.feesEarned'
  | 'group.quickActionSchedule'
  | 'group.quickActionInvite'
  | 'group.quickActionEdit'
  | 'group.quickActionAdmin'
  | 'group.detail.startTitle'
  | 'group.detail.startReady'
  | 'group.detail.startWaiting'
  | 'group.detail.startButton'
  | 'group.detail.startEnterApp'
  | 'group.detail.startNeedMembers'
  | 'group.detail.collectionTitle'
  | 'group.detail.finalCollectionTitle'
  | 'group.detail.sendCollection'
  | 'group.detail.recordCollection'
  | 'group.detail.sendFinalCollection'
  | 'group.detail.recordFinalCollection'
  | 'group.detail.finalCollectionHint'
  | 'group.detail.nextRoundTitle'
  | 'group.detail.nextRoundSubtitle'
  | 'group.detail.nextRoundButton'
  | 'group.detail.endCircleTitle'
  | 'group.detail.endCircleSubtitle'
  | 'group.detail.endCircleButton'
  | 'group.detail.endCircleHint'
  | 'group.detail.collectionOrder'
  | 'group.detail.stepOut'
  | 'group.detail.joinRotation'
  | 'group.detail.history'
  | 'contributions.filteredTitle'
  | 'home.welcomeBack'
  | 'home.welcomeBackName'
  | 'home.startFirstCircle'
  | 'home.startFirstCircleSubtitle'
  | 'home.circleBadge'
  | 'home.featureSecure'
  | 'home.featureSchedule'
  | 'home.featureTurns'
  | 'home.featureSecureDesc'
  | 'home.featureScheduleDesc'
  | 'home.featureTurnsDesc'
  | 'home.featureSecureDetail'
  | 'home.featureScheduleDetail'
  | 'home.featureTurnsDetail'
  | 'home.featureLearnMore'
  | 'home.invitationsHint'
  | 'home.noActiveCircle'
  | 'home.noActiveCircleSubtitle'
  | 'home.createGroup'
  | 'home.joinGroup'
  | 'home.viewGroups'
  | 'home.howItWorks'
  | 'home.step'
  | 'home.stepCreateJoin'
  | 'home.stepInvite'
  | 'home.stepContribute'
  | 'home.stepPayouts'
  | 'home.invitations'
  | 'home.noInvitations'
  | 'home.turnMoney'
  | 'home.notStartedYet'
  | 'home.notAvailableYet'
  | 'home.thisRound'
  | 'home.paidCount'
  | 'home.collectionReady'
  | 'home.sendCollection'
  | 'home.recordCollection'
  | 'home.collectionRecorded'
  | 'home.collectionSent'
  | 'home.collectionSendFailed'
  | 'cycle.currentRound'
  | 'cycle.finalTurn'
  | 'cycle.noActiveRound'
  | 'cycle.collectorLine'
  | 'cycle.dueLine'
  | 'cycle.paymentsThisRound'
  | 'cycle.paymentsMissing'
  | 'cycle.paidProgress'
  | 'group.editDraftLockedHint'
  | 'group.turnMoneyUpTo'
  | 'group.turnMoneyActive'
  | 'group.collectorReceives'
  | 'create.payInPerMember'
  | 'create.basicsSection'
  | 'create.groupNameLabel'
  | 'create.groupNamePlaceholder'
  | 'create.maxMembersLabel'
  | 'create.scheduleSection'
  | 'create.feesSection'
  | 'create.adminFeeLabel'
  | 'create.roleSection'
  | 'create.roleParticipateHint'
  | 'create.roleOrganizerHint'
  | 'create.roleParticipate'
  | 'create.roleOrganizer'
  | 'create.summarySection'
  | 'create.schedulePayInsNote'
  | 'create.collectionFrequencyLabel'
  | 'create.collectionFrequencyHint'
  | 'create.collectionDaily'
  | 'create.collectionWeekly'
  | 'create.collectionMonthly'
  | 'create.collectionCustom'
  | 'create.collectionEveryDays'
  | 'create.customCollectionDaysLabel'
  | 'create.customCollectionDaysHint'
  | 'create.payoutFrequencyLabel'
  | 'create.payoutFrequencyHint'
  | 'create.payoutWeekly'
  | 'create.payoutMonthly'
  | 'create.payoutEndOfCycle'
  | 'create.scheduleSummaryLine'
  | 'create.scheduleCollectionRequired'
  | 'create.schedulePayoutRequired'
  | 'create.scheduleCustomDaysInvalid'
  | 'create.editDraftTitle'
  | 'create.saveDraftChanges'
  | 'create.maxMembersTooLow'
  | 'create.monthlyTurnTarget'
  | 'create.perPayment'
  | 'create.monthlyTarget'
  | 'create.turnMoneyLine'
  | 'create.monthlyTargetTip'
  | 'create.applyPayInHint'
  | 'create.applyPayInTitle'
  | 'create.applyPayInBody'
  | 'create.summaryHint'
  | 'create.monthlyTurnTotal'
  | 'create.useAmount'
  | 'create.weeklySaveMonthly'
  | 'create.parkoutModeDesc'
  | 'create.parkoutPayInLabel'
  | 'create.parkoutDurationLabel'
  | 'create.parkoutDurationHint'
  | 'create.parkoutDurationInvalid'
  | 'create.parkoutPayInFrequency'
  | 'create.parkoutSummary'
  | 'create.useParkoutSetup'
  | 'create.applyParkoutHint'
  | 'create.applyParkoutTitle'
  | 'create.applyParkoutBody'
  | 'create.parkoutFullCircle'
  | 'cycle.weeklyPayInsThisMonth'
  | 'cycle.weeklyPaidProgress'
  | 'cycle.memberWeekProgress'
  | 'cycle.weekPayIn'
  | 'schedule.title'
  | 'schedule.draftSubtitle'
  | 'schedule.activeSubtitle'
  | 'schedule.empty'
  | 'schedule.footnote'
  | 'profile.section.account'
  | 'profile.section.savings'
  | 'profile.section.notifications'
  | 'profile.section.security'
  | 'profile.section.preferences'
  | 'profile.section.support'
  | 'profile.personalInfo'
  | 'profile.personalInfoSubtitle'
  | 'profile.bank'
  | 'profile.bankRequired'
  | 'profile.identity'
  | 'profile.changeContact'
  | 'profile.changeContactSubtitle'
  | 'profile.myGroups'
  | 'profile.myGroupsSubtitle'
  | 'profile.viewProfile'
  | 'profile.hubTitle'
  | 'profile.messagesHubSubtitle'
  | 'profile.contributionHistory'
  | 'profile.payoutHistory'
  | 'profile.inviteCodes'
  | 'profile.inviteCodesSubtitle'
  | 'profile.groupAlerts'
  | 'profile.groupAlertsSubtitle'
  | 'profile.pushNotifications'
  | 'profile.reminderSettings'
  | 'profile.appLock'
  | 'profile.transactionPin'
  | 'profile.changePassword'
  | 'profile.accountPasswordNotSet'
  | 'profile.accountPasswordSet'
  | 'profile.activeDevices'
  | 'profile.currency'
  | 'profile.currencyValue'
  | 'profile.language'
  | 'profile.theme'
  | 'profile.themeValue'
  | 'profile.reminderTime'
  | 'profile.helpCenter'
  | 'profile.contactSupport'
  | 'profile.termsPrivacy'
  | 'profile.about'
  | 'profile.settingsTitle'
  | 'profile.manageAccount'
  | 'profile.logout'
  | 'profile.footer'
  | 'profile.editProfile'
  | 'profile.photoTitle'
  | 'profile.photoHint'
  | 'profile.photoChoose'
  | 'profile.photoTake'
  | 'profile.photoRemove'
  | 'profile.photoUpdatedTitle'
  | 'profile.photoUpdatedBody'
  | 'profile.photoPermissionTitle'
  | 'profile.photoPermissionBody'
  | 'profile.photoSetupTitle'
  | 'profile.photoSetupBody'
  | 'profile.photoFailedTitle'
  | 'profile.photoFailedBody'
  | 'profile.photoRlsBody'
  | 'profile.payoutLinked'
  | 'profile.saved'
  | 'profile.savedBody'
  | 'profile.savedEmailConfirm'
  | 'profile.enterAppFirst'
  | 'profile.enterAppFirstTitle'
  | 'profile.signOutTitle'
  | 'profile.signOutBody'
  | 'profile.signOut'
  | 'profileSetup.title'
  | 'profileSetup.body'
  | 'profileSetup.missingName'
  | 'profileSetup.missingPhone'
  | 'profileSetup.missingBank'
  | 'profileSetup.editProfile'
  | 'profileSetup.addBank'
  | 'profileSetup.bannerTitle'
  | 'profileSetup.bannerBody'
  | 'profileSetup.completeSetup'
  | 'profileSetup.reminderTitle'
  | 'profileSetup.reminderBody'
  | 'profileSetup.dismissReminder'
  | 'profileSetup.swipeToDismiss'
  | 'groups.notInApp'
  | 'groups.notInAppBody'
  | 'groups.noGroups'
  | 'groups.noGroupsMessage'
  | 'groups.active'
  | 'groups.settingUp'
  | 'groups.history'
  | 'contributions.title'
  | 'contributions.empty'
  | 'contributions.notInAppBody'
  | 'contributions.emptyMessage'
  | 'contributions.summary'
  | 'contributions.paid'
  | 'contributions.pending'
  | 'contributions.totalPaid'
  | 'contributions.tapToPay'
  | 'contributions.searchPlaceholder'
  | 'contributions.searchEmpty'
  | 'payments.transferToAdmin'
  | 'payments.cardPayDisabled'
  | 'payments.payoutDirect'
  | 'messages.emptyTitle'
  | 'messages.emptyMessage'
  | 'messages.memberFallback'
  | 'messages.youPrefix'
  | 'messages.sendMessage'
  | 'messages.sendTo'
  | 'messages.you'
  | 'messages.roleAdminContributor'
  | 'messages.roleMember'
  | 'messages.roleAdmin'
  | 'messages.roleAdminOrganizer'
  | 'messages.collected'
  | 'messages.collectingThisCycle'
  | 'messages.searchPlaceholder'
  | 'messages.searchEmpty'
  | 'messages.renameHint'
  | 'messages.saveNameTitle'
  | 'messages.saveNameHint'
  | 'messages.saveNameLabel'
  | 'messages.saveNamePlaceholder'
  | 'messages.saveNameClear'
  | 'messages.saveNameAction'
  | 'messages.profileNameLine'
  | 'messages.threadEmpty'
  | 'messages.inputPlaceholder'
  | 'messages.send'
  | 'messages.notInstalled'
  | 'messages.sendFailed'
  | 'notifications.title'
  | 'notifications.empty'
  | 'notifications.signInHint'
  | 'notifications.markAllRead'
  | 'notifications.filterTitle'
  | 'notifications.filterAll'
  | 'notifications.filterUnread'
  | 'notifications.filterPayments'
  | 'notifications.filterPayouts'
  | 'notifications.filterMembers'
  | 'notifications.filterEmpty'
  | 'notifications.notSetupTitle'
  | 'notifications.notSetupMessage'
  | 'notifications.emptyMessage'
  | 'auth.enterAppTitle'
  | 'auth.enterAppBody'
  | 'auth.continueAsGuest'
  | 'auth.signInEmail'
  | 'auth.loginTitle'
  | 'auth.signUpTitle'
  | 'auth.logInTitle'
  | 'auth.loginSubtitle'
  | 'auth.loginModeSubtitle'
  | 'auth.signUpModeSubtitle'
  | 'auth.alreadyHaveAccount'
  | 'auth.needAccountFirst'
  | 'auth.logInTab'
  | 'auth.signUpTab'
  | 'auth.logInButton'
  | 'auth.signUpButton'
  | 'auth.enterAppFooter'
  | 'auth.enterAppLoading'
  | 'auth.simpleLoginSubtitle'
  | 'auth.simpleLoginBody'
  | 'auth.enterAppButton'
  | 'auth.guestRecommend'
  | 'auth.enterAppNoEmail'
  | 'auth.emailOptionalDivider'
  | 'auth.emailLabel'
  | 'auth.emailPlaceholder'
  | 'auth.sendSignInEmail'
  | 'auth.sendSignInCode'
  | 'auth.enterEmailError'
  | 'auth.invalidEmail'
  | 'auth.passwordDivider'
  | 'auth.passwordLabel'
  | 'auth.passwordPlaceholder'
  | 'auth.confirmPasswordLabel'
  | 'auth.confirmPasswordPlaceholder'
  | 'auth.passwordMismatch'
  | 'auth.passwordTooShort'
  | 'auth.signInWithPassword'
  | 'auth.enterPasswordError'
  | 'auth.useEmailCodeInstead'
  | 'auth.usePasswordInstead'
  | 'auth.forgotPassword'
  | 'auth.resetPasswordSentTitle'
  | 'auth.resetPasswordSentBody'
  | 'auth.resetPasswordTitle'
  | 'auth.resetPasswordSubtitle'
  | 'auth.resetPasswordCodeSubtitle'
  | 'auth.resetPasswordCodeHint'
  | 'auth.resetPasswordButton'
  | 'auth.resetPasswordSuccessTitle'
  | 'auth.resetPasswordSuccessBody'
  | 'auth.resetPasswordNeedLink'
  | 'auth.linkEmailDivider'
  | 'auth.linkingGuestNote'
  | 'auth.linkEmailButton'
  | 'auth.resendWait'
  | 'auth.openEmailApp'
  | 'auth.backToSignIn'
  | 'auth.callbackSigningIn'
  | 'auth.callbackNoData'
  | 'auth.callbackFailed'
  | 'auth.couldNotEnterAppTitle'
  | 'auth.supabaseNotConfiguredTitle'
  | 'auth.supabaseNotConfiguredBody'
  | 'auth.supabaseNotConfiguredInline'
  | 'auth.requestAcceptedTitle'
  | 'auth.requestAcceptedBody'
  | 'auth.redirectHint'
  | 'auth.copyRedirectTitle'
  | 'auth.copyRedirectBody'
  | 'auth.tapToCopyRedirect'
  | 'auth.expoGoRedirectNote'
  | 'auth.noCodeTitle'
  | 'auth.noCodeStep1'
  | 'auth.noCodeStep2'
  | 'auth.noCodeStep3'
  | 'auth.skipEmailEnterApp'
  | 'auth.previewUiOnly'
  | 'auth.verifyTitle'
  | 'auth.verifySubtitle'
  | 'auth.verifyHelp'
  | 'auth.codeLabel'
  | 'auth.codePlaceholder'
  | 'auth.verifyCode'
  | 'auth.resendEmail'
  | 'auth.wrongEmailHint'
  | 'auth.noEmailTip'
  | 'auth.enterCodeError'
  | 'auth.configureSupabaseFirst'
  | 'auth.expoGoOpenWithHint'
  | 'auth.appLinkHint'
  | 'auth.orContinueWith'
  | 'auth.continueWithGoogle'
  | 'auth.continueWithApple'
  | 'auth.oauthFailed'
  | 'auth.oauthSetupHint'
  | 'auth.signInRequiredTitle'
  | 'auth.signInRequiredBody'
  | 'identityGate.title'
  | 'identityGate.body'
  | 'identityGate.verifyNow'
  | 'payoutOrder.title'
  | 'payoutOrder.subtitleAdmin'
  | 'payoutOrder.subtitleMember'
  | 'payoutOrder.tapToChange'
  | 'payoutOrder.collects'
  | 'payoutOrder.addRound'
  | 'payoutOrder.addRoundHint'
  | 'payoutOrder.saveOrder'
  | 'payoutOrder.unsaved'
  | 'payoutOrder.savedTitle'
  | 'payoutOrder.savedBody'
  | 'payoutOrder.changeCollectorTitle'
  | 'payoutOrder.changeCollectorHint'
  | 'payment.recordTitle'
  | 'payment.methodLabel'
  | 'payment.methodCash'
  | 'payment.methodTransfer'
  | 'payment.methodPos'
  | 'payment.methodOther'
  | 'payment.methodPaystack'
  | 'payment.methodUnknown'
  | 'payment.noteLabel'
  | 'payment.notePlaceholder'
  | 'payment.confirmRecord'
  | 'cycleSwap.title'
  | 'cycleSwap.subtitle'
  | 'cycleSwap.request'
  | 'cycleSwap.alreadyCollected'
  | 'cycleSwap.line'
  | 'cycleSwap.scheduledApproval'
  | 'cycleSwap.adminApproval'
  | 'cycleSwap.approve'
  | 'cycleSwap.approveAsAdmin'
  | 'cycleSwap.decline'
  | 'platform.noCustody'
  | 'payouts.notInAppBody'
  | 'payouts.summary'
  | 'payouts.totalReceived'
  | 'payouts.completed'
  | 'payouts.pending'
  | 'payouts.empty'
  | 'payouts.emptyMessage'
  | 'payouts.cycle'
  | 'payouts.received'
  | 'payouts.tapGroup'
  | 'account.preview'
  | 'account.guest'
  | 'account.signedIn'
  | 'account.notSignedIn'
  | 'push.enabled'
  | 'push.off'
  | 'push.notSet'
  | 'push.simulator'
  | 'push.disabled'
  | 'push.enabledAlertTitle'
  | 'push.enabledAlertBody'
  | 'push.deniedTitle'
  | 'push.deniedBody'
  | 'push.openSettings'
  | 'push.disable'
  | 'push.enabledTitle'
  | 'push.enabledBody'
  | 'push.simulatorTitle'
  | 'push.simulatorBody'
  | 'push.noProjectIdTitle'
  | 'push.noProjectIdBody'
  | 'push.dbErrorTitle'
  | 'push.dbErrorBody'
  | 'push.registerFailedTitle'
  | 'push.registerFailedBody'
  | 'reminders.title'
  | 'reminders.hint'
  | 'reminders.master'
  | 'reminders.masterHint'
  | 'reminders.contributions'
  | 'reminders.contributionsHint'
  | 'reminders.overdue'
  | 'reminders.overdueHint'
  | 'reminders.payouts'
  | 'reminders.payoutsHint'
  | 'reminders.timeTitle'
  | 'reminders.timeHint'
  | 'reminders.timeSelected'
  | 'reminders.on'
  | 'reminders.off'
  | 'reminders.setupTitle'
  | 'reminders.setupBody'
  | 'reminders.saveFailedTitle'
  | 'reminders.saveFailedBody'
  | 'language.title'
  | 'language.hint'
  | 'language.selected'
  | 'language.changed'
  | 'theme.title'
  | 'theme.hint'
  | 'theme.appearanceTitle'
  | 'theme.backgroundTitle'
  | 'theme.backgroundHint'
  | 'theme.background.default'
  | 'theme.background.light'
  | 'theme.background.warm'
  | 'theme.background.cool'
  | 'theme.background.purple'
  | 'theme.system'
  | 'theme.light'
  | 'theme.dark'
  | 'theme.selected'
  | 'security.appLock.title'
  | 'security.appLock.hint'
  | 'security.appLock.toggle'
  | 'security.appLock.toggleHint'
  | 'security.appLock.on'
  | 'security.appLock.off'
  | 'security.appLock.unavailableTitle'
  | 'security.appLock.unavailableBody'
  | 'security.appLock.enablePrompt'
  | 'security.appLock.disablePrompt'
  | 'security.appLock.enableFailedTitle'
  | 'security.appLock.enableFailedBody'
  | 'security.appLock.unlockTitle'
  | 'security.appLock.unlockHint'
  | 'security.appLock.unlockButton'
  | 'security.appLock.unlocking'
  | 'security.appLock.expoGoNotice'
  | 'security.appLock.expoGoToggleHint'
  | 'security.appLock.passcodeOnlyNotice'
  | 'security.pin.title'
  | 'security.pin.hint'
  | 'security.pin.set'
  | 'security.pin.change'
  | 'security.pin.remove'
  | 'security.pin.current'
  | 'security.pin.new'
  | 'security.pin.confirm'
  | 'security.pin.confirmHint'
  | 'security.pin.enterHint'
  | 'security.pin.mismatchTitle'
  | 'security.pin.mismatch'
  | 'security.pin.wrongPin'
  | 'security.pin.wrongPinTitle'
  | 'security.pin.savedTitle'
  | 'security.pin.savedBody'
  | 'security.pin.removedTitle'
  | 'security.pin.removedBody'
  | 'security.pin.removeConfirmTitle'
  | 'security.pin.removeConfirmBody'
  | 'security.pin.saveFailedTitle'
  | 'security.pin.saveFailedBody'
  | 'security.pin.on'
  | 'security.pin.off'
  | 'security.pin.verifyTitle'
  | 'security.pin.verifyHint'
  | 'security.signIn.title'
  | 'security.signIn.hint'
  | 'security.signIn.passwordlessTitle'
  | 'security.signIn.passwordlessBody'
  | 'security.signIn.guestTitle'
  | 'security.signIn.guestBody'
  | 'security.signIn.sendCode'
  | 'security.signIn.emailSentTitle'
  | 'security.signIn.emailSentBody'
  | 'security.signIn.switchEmail'
  | 'security.signIn.sendFailedTitle'
  | 'security.password.set'
  | 'security.password.change'
  | 'security.password.hint'
  | 'security.password.accountEmail'
  | 'security.password.guestHint'
  | 'security.password.savedTitle'
  | 'security.password.savedBody'
  | 'security.devices.title'
  | 'security.devices.hint'
  | 'security.devices.thisDevice'
  | 'security.devices.os'
  | 'security.devices.appVersion'
  | 'security.devices.signedIn'
  | 'security.devices.signOutOthers'
  | 'security.devices.signOutOthersConfirmTitle'
  | 'security.devices.signOutOthersConfirmBody'
  | 'security.devices.signOutOthersDoneTitle'
  | 'security.devices.signOutOthersDoneBody'
  | 'security.devices.signOutEverywhere'
  | 'security.devices.signOutEverywhereConfirmTitle'
  | 'security.devices.signOutEverywhereConfirmBody'
  | 'security.devices.actionFailedTitle'
  | 'help.hint'
  | 'help.footer'
  | 'help.faq1q'
  | 'help.faq1a'
  | 'help.faq2q'
  | 'help.faq2a'
  | 'help.faq3q'
  | 'help.faq3a'
  | 'help.faq4q'
  | 'help.faq4a'
  | 'help.faq5q'
  | 'help.faq5a'
  | 'support.hint'
  | 'support.emailLabel'
  | 'support.responseHint'
  | 'support.openEmail'
  | 'support.copyEmail'
  | 'support.copiedTitle'
  | 'support.copiedBody'
  | 'terms.lastUpdated'
  | 'terms.intro'
  | 'terms.section1Title'
  | 'terms.section1Body'
  | 'terms.section2Title'
  | 'terms.section2Body'
  | 'terms.privacyTitle'
  | 'terms.privacyBody'
  | 'about.tagline'
  | 'about.version'
  | 'about.missionTitle'
  | 'about.missionBody'
  | 'identity.statusLabel'
  | 'identity.hint'
  | 'identity.statusNotStarted'
  | 'identity.statusInReview'
  | 'identity.statusVerified'
  | 'identity.previewBadge'
  | 'identity.placeholderTitle'
  | 'identity.placeholderBody'
  | 'identity.step1Title'
  | 'identity.step1Body'
  | 'identity.realKycTitle'
  | 'identity.realKycBody'
  | 'identity.missingName'
  | 'identity.missingPhone'
  | 'identity.missingEmail'
  | 'identity.editProfileButton'
  | 'identity.startButton'
  | 'identity.completeButton'
  | 'identity.completeButtonOtpOnly'
  | 'identity.submitButton'
  | 'identity.confirmTitle'
  | 'identity.confirmBody'
  | 'identity.submittedTitle'
  | 'identity.submittedBody'
  | 'identity.reviewNote'
  | 'identity.verifiedNote'
  | 'identity.verifiedPreviewNote'
  | 'identity.verifiedOtpNote'
  | 'identity.verifiedYouverifyNote'
  | 'identity.otpBadge'
  | 'identity.ninBadge'
  | 'identity.stepProfile'
  | 'identity.stepPhone'
  | 'identity.stepEmail'
  | 'identity.stepNin'
  | 'identity.adminRequirementNote'
  | 'identity.ninTitle'
  | 'identity.ninBody'
  | 'identity.ninSandboxHint'
  | 'identity.ninLabel'
  | 'identity.ninSelfieLabel'
  | 'identity.ninSelfiePlaceholder'
  | 'identity.ninTakeSelfie'
  | 'identity.ninRetakeSelfie'
  | 'identity.ninConsentLabel'
  | 'identity.ninSubmitButton'
  | 'identity.ninInvalidTitle'
  | 'identity.ninInvalidBody'
  | 'identity.ninConsentTitle'
  | 'identity.ninConsentBody'
  | 'identity.ninSelfieRequiredTitle'
  | 'identity.ninSelfieRequiredBody'
  | 'identity.ninSelfieFailedTitle'
  | 'identity.ninSelfiePermission'
  | 'identity.ninFailedTitle'
  | 'identity.quickVerifyTitle'
  | 'identity.quickVerifyBody'
  | 'identity.quickVerifyButton'
  | 'otp.phoneTitle'
  | 'otp.phoneSubtitle'
  | 'otp.phoneVerified'
  | 'otp.emailTitle'
  | 'otp.emailSubtitle'
  | 'otp.emailVerified'
  | 'otp.sendCode'
  | 'otp.sentPhone'
  | 'otp.sentEmail'
  | 'otp.codeLabel'
  | 'otp.codePlaceholder'
  | 'otp.verifyCode'
  | 'otp.expiryHint'
  | 'otp.devCodeHint'
  | 'otp.devModePhoneTitle'
  | 'otp.devModePhoneBody'
  | 'otp.devModeEmailTitle'
  | 'otp.devModeEmailBody'
  | 'otp.devModeVerifyHint'
  | 'otp.devCodeTapCopy'
  | 'otp.devCodeCopyA11y'
  | 'otp.devCodeCopiedTitle'
  | 'otp.devCodeCopiedBody'
  | 'otp.sendFailedTitle'
  | 'otp.verifyFailedTitle'
  | 'otp.missingCodeTitle'
  | 'otp.missingCodeBody'
  | 'otp.verifiedTitle'
  | 'groupAdmin.verifyRequiredTitle'
  | 'groupAdmin.verifyRequiredNotStarted'
  | 'groupAdmin.verifyRequiredInReview'
  | 'groupAdmin.verifyButton'
  | 'admin.modeLabel'
  | 'admin.modeManaging'
  | 'admin.modeParticipating'
  | 'admin.modeSwitch'
  | 'admin.dashboardTitle'
  | 'admin.dashboardSubtitle'
  | 'admin.cardBrand'
  | 'admin.cardHolder'
  | 'admin.cardTapHint'
  | 'admin.quickEarnings'
  | 'admin.kpiGroups'
  | 'admin.kpiActiveCount_one'
  | 'admin.kpiActiveCount_other'
  | 'admin.kpiCompletedCount_one'
  | 'admin.kpiCompletedCount_other'
  | 'admin.kpiMembers'
  | 'admin.kpiReceived'
  | 'admin.kpiEarnings'
  | 'admin.totalCollected'
  | 'admin.kpiOutstanding'
  | 'admin.kpiPending'
  | 'admin.kpiPayouts'
  | 'admin.createGroup'
  | 'admin.viewLedger'
  | 'admin.groupHealth'
  | 'admin.managedGroups_one'
  | 'admin.managedGroups_other'
  | 'admin.noActiveGroupsShort'
  | 'admin.noActiveGroupsShort_one'
  | 'admin.noActiveGroupsShort_other'
  | 'admin.groupCollected'
  | 'admin.groupEarned'
  | 'admin.groupCycles_one'
  | 'admin.groupCycles_other'
  | 'admin.groupDraftHint_one'
  | 'admin.groupDraftHint_other'
  | 'admin.groupPendingCount_one'
  | 'admin.groupPendingCount_other'
  | 'admin.groupProgress'
  | 'admin.nextPayout'
  | 'admin.dateTbd'
  | 'admin.noGroupsYet'
  | 'admin.noGroupsHint'
  | 'admin.noActiveGroupsHint'
  | 'admin.dashboardLoadErrorTitle'
  | 'admin.dashboardLoadErrorMessage'
  | 'admin.tryAgain'
  | 'admin.verifyIdentity'
  | 'admin.recentActivity'
  | 'admin.ledgerIntro'
  | 'admin.searchLabel'
  | 'admin.searchPlaceholder'
  | 'admin.filterAll'
  | 'admin.filterPending'
  | 'admin.filterPaid'
  | 'admin.filterFailed'
  | 'admin.ledgerEmpty'
  | 'admin.cycleLabel'
  | 'admin.payoutsIntro'
  | 'admin.payoutsEmpty'
  | 'admin.readyPayout'
  | 'admin.collecting'
  | 'admin.moreOperations'
  | 'admin.moreAccount'
  | 'admin.membersHub'
  | 'admin.transparencyCenter'
  | 'admin.reports'
  | 'admin.currentPlan'
  | 'admin.moreFooter'
  | 'admin.transparencyTitle'
  | 'admin.transparencySubtitle'
  | 'admin.transparencyEmpty'
  | 'admin.payContribution'
  | 'admin.viewSchedule'
  | 'admin.groupAdminTitle'
  | 'admin.groupAdminDenied'
  | 'admin.groupAdminSubtitle'
  | 'admin.manageGroup'
  | 'admin.inviteMembers'
  | 'admin.groupNotes';

export const TRANSLATION_KEYS: TranslationKey[] = [
  'nav.home',
  'nav.groups',
  'nav.messages',
  'nav.contributions',
  'nav.alerts',
  'nav.profile',
  'nav.dashboard',
  'nav.ledger',
  'nav.payouts',
  'nav.more',
  'common.cancel',
  'common.done',
  'common.save',
  'common.create',
  'common.join',
  'common.comingSoon',
  'common.ok',
  'common.gotIt',
  'common.goToProfile',
  'common.loading',
  'plural.group_one',
  'plural.group_other',
  'plural.member_one',
  'plural.member_other',
  'plural.memberNoun_one',
  'plural.memberNoun_other',
  'plural.cycle_one',
  'plural.cycle_other',
  'plural.spotLeft_one',
  'plural.spotLeft_other',
  'plural.moreMember_one',
  'plural.moreMember_other',
  'plural.activeCount_one',
  'plural.activeCount_other',
  'plural.finished_one',
  'plural.finished_other',
  'plural.roster_one',
  'plural.roster_other',
  'plural.contributionPaid_one',
  'plural.contributionPaid_other',
  'plural.cyclePosition_one',
  'plural.cyclePosition_other',
  'plural.groupMeta_one',
  'plural.groupMeta_other',
  'plural.poolMembers_one',
  'plural.poolMembers_other',
  'plural.sharedGroups_one',
  'plural.sharedGroups_other',
  'plural.noSharedGroups',
  'group.draftTitle',
  'group.draftSpotsLeft',
  'group.draftStartWhenFull_one',
  'group.draftStartWhenFull_other',
  'group.draftOrganizerWhenFull_one',
  'group.draftOrganizerWhenFull_other',
  'group.draftWaitingAdmin_one',
  'group.draftWaitingAdmin_other',
  'group.draftRosterFull',
  'group.draftWaitingTitle_one',
  'group.draftWaitingTitle_other',
  'group.draftNeedMore_one',
  'group.draftNeedMore_other',
  'group.draftJoinedLine_one',
  'group.draftJoinedLine_other',
  'group.draftReadyAdmin',
  'group.draftReadyMember_one',
  'group.draftReadyMember_other',
  'group.draftUnlockHint_one',
  'group.draftUnlockHint_other',
  'group.membersSection',
  'group.previewMembers_one',
  'group.previewMembers_other',
  'group.previewFull',
  'group.rosterIncomplete',
  'group.onlyAdminStarts_one',
  'group.onlyAdminStarts_other',
  'group.cycleFinished_one',
  'group.cycleFinished_other',
  'group.cycleHistory',
  'group.viewFullHistory',
  'group.viewHistory',
  'group.paidOut',
  'group.fees',
  'group.fullHistoryTitle',
  'group.historyCycles',
  'group.historyPaidOut',
  'group.historyTotal',
  'group.historyFeesNote',
  'group.historyEmpty',
  'group.historyAllInOne',
  'group.cycleDetailTitle',
  'group.cycleNotFound',
  'group.cycleCollector',
  'group.cycleDue',
  'group.cyclePayout',
  'group.cycleFee',
  'group.cyclePaidOn',
  'group.cycleContributions',
  'group.cycleNoContributions',
  'group.contributionsPaid',
  'group.perMember',
  'group.you',
  'group.amountCollected',
  'group.amountWaiting',
  'group.detail.perDrop',
  'group.detail.perDropMulti',
  'group.detail.roster',
  'group.detail.turnMoney',
  'group.detail.turnMoneyUpTo',
  'group.detail.adminFeeNote',
  'group.detail.feesEarned',
  'group.quickActionSchedule',
  'group.quickActionInvite',
  'group.quickActionEdit',
  'group.quickActionAdmin',
  'group.detail.startTitle',
  'group.detail.startReady',
  'group.detail.startWaiting',
  'group.detail.startButton',
  'group.detail.startEnterApp',
  'group.detail.startNeedMembers',
  'group.detail.collectionTitle',
  'group.detail.finalCollectionTitle',
  'group.detail.sendCollection',
  'group.detail.recordCollection',
  'group.detail.sendFinalCollection',
  'group.detail.recordFinalCollection',
  'group.detail.finalCollectionHint',
  'group.detail.nextRoundTitle',
  'group.detail.nextRoundSubtitle',
  'group.detail.nextRoundButton',
  'group.detail.endCircleTitle',
  'group.detail.endCircleSubtitle',
  'group.detail.endCircleButton',
  'group.detail.endCircleHint',
  'group.detail.collectionOrder',
  'group.detail.stepOut',
  'group.detail.joinRotation',
  'group.detail.history',
  'contributions.filteredTitle',
  'home.welcomeBack',
  'home.welcomeBackName',
  'home.startFirstCircle',
  'home.startFirstCircleSubtitle',
  'home.circleBadge',
  'home.featureSecure',
  'home.featureSchedule',
  'home.featureTurns',
  'home.featureSecureDesc',
  'home.featureScheduleDesc',
  'home.featureTurnsDesc',
  'home.featureSecureDetail',
  'home.featureScheduleDetail',
  'home.featureTurnsDetail',
  'home.featureLearnMore',
  'home.invitationsHint',
  'home.noActiveCircle',
  'home.noActiveCircleSubtitle',
  'home.createGroup',
  'home.joinGroup',
  'home.viewGroups',
  'home.howItWorks',
  'home.step',
  'home.stepCreateJoin',
  'home.stepInvite',
  'home.stepContribute',
  'home.stepPayouts',
  'home.invitations',
  'home.noInvitations',
  'home.turnMoney',
  'home.notStartedYet',
  'home.notAvailableYet',
  'home.thisRound',
  'home.paidCount',
  'home.collectionReady',
  'home.sendCollection',
  'home.recordCollection',
  'home.collectionRecorded',
  'home.collectionSent',
  'home.collectionSendFailed',
  'cycle.currentRound',
  'cycle.finalTurn',
  'cycle.noActiveRound',
  'cycle.collectorLine',
  'cycle.dueLine',
  'cycle.paymentsThisRound',
  'cycle.paymentsMissing',
  'cycle.paidProgress',
  'group.editDraftLockedHint',
  'group.turnMoneyUpTo',
  'group.turnMoneyActive',
  'group.collectorReceives',
  'create.payInPerMember',
  'create.basicsSection',
  'create.groupNameLabel',
  'create.groupNamePlaceholder',
  'create.maxMembersLabel',
  'create.scheduleSection',
  'create.feesSection',
  'create.adminFeeLabel',
  'create.roleSection',
  'create.roleParticipateHint',
  'create.roleOrganizerHint',
  'create.roleParticipate',
  'create.roleOrganizer',
  'create.summarySection',
  'create.schedulePayInsNote',
  'create.collectionFrequencyLabel',
  'create.collectionFrequencyHint',
  'create.collectionDaily',
  'create.collectionWeekly',
  'create.collectionMonthly',
  'create.collectionCustom',
  'create.collectionEveryDays',
  'create.customCollectionDaysLabel',
  'create.customCollectionDaysHint',
  'create.payoutFrequencyLabel',
  'create.payoutFrequencyHint',
  'create.payoutWeekly',
  'create.payoutMonthly',
  'create.payoutEndOfCycle',
  'create.scheduleSummaryLine',
  'create.scheduleCollectionRequired',
  'create.schedulePayoutRequired',
  'create.scheduleCustomDaysInvalid',
  'create.editDraftTitle',
  'create.saveDraftChanges',
  'create.maxMembersTooLow',
  'create.monthlyTurnTarget',
  'create.perPayment',
  'create.monthlyTarget',
  'create.turnMoneyLine',
  'create.monthlyTargetTip',
  'create.applyPayInHint',
  'create.applyPayInTitle',
  'create.applyPayInBody',
  'create.summaryHint',
  'create.monthlyTurnTotal',
  'create.useAmount',
  'create.weeklySaveMonthly',
  'create.parkoutModeDesc',
  'create.parkoutPayInLabel',
  'create.parkoutDurationLabel',
  'create.parkoutDurationHint',
  'create.parkoutDurationInvalid',
  'create.parkoutPayInFrequency',
  'create.parkoutSummary',
  'create.useParkoutSetup',
  'create.applyParkoutHint',
  'create.applyParkoutTitle',
  'create.applyParkoutBody',
  'create.parkoutFullCircle',
  'cycle.weeklyPayInsThisMonth',
  'cycle.weeklyPaidProgress',
  'cycle.memberWeekProgress',
  'cycle.weekPayIn',
  'schedule.title',
  'schedule.draftSubtitle',
  'schedule.activeSubtitle',
  'schedule.empty',
  'schedule.footnote',
  'profile.section.account',
  'profile.section.savings',
  'profile.section.notifications',
  'profile.section.security',
  'profile.section.preferences',
  'profile.section.support',
  'profile.personalInfo',
  'profile.personalInfoSubtitle',
  'profile.bank',
  'profile.bankRequired',
  'profile.identity',
  'profile.changeContact',
  'profile.changeContactSubtitle',
  'profile.myGroups',
  'profile.myGroupsSubtitle',
  'profile.viewProfile',
  'profile.hubTitle',
  'profile.messagesHubSubtitle',
  'profile.contributionHistory',
  'profile.payoutHistory',
  'profile.inviteCodes',
  'profile.inviteCodesSubtitle',
  'profile.groupAlerts',
  'profile.groupAlertsSubtitle',
  'profile.pushNotifications',
  'profile.reminderSettings',
  'profile.appLock',
  'profile.transactionPin',
  'profile.changePassword',
  'profile.accountPasswordNotSet',
  'profile.accountPasswordSet',
  'profile.activeDevices',
  'profile.currency',
  'profile.currencyValue',
  'profile.language',
  'profile.theme',
  'profile.themeValue',
  'profile.reminderTime',
  'profile.helpCenter',
  'profile.contactSupport',
  'profile.termsPrivacy',
  'profile.about',
  'profile.settingsTitle',
  'profile.manageAccount',
  'profile.logout',
  'profile.footer',
  'profile.editProfile',
  'profile.photoTitle',
  'profile.photoHint',
  'profile.photoChoose',
  'profile.photoTake',
  'profile.photoRemove',
  'profile.photoUpdatedTitle',
  'profile.photoUpdatedBody',
  'profile.photoPermissionTitle',
  'profile.photoPermissionBody',
  'profile.photoSetupTitle',
  'profile.photoSetupBody',
  'profile.photoFailedTitle',
  'profile.photoFailedBody',
  'profile.photoRlsBody',
  'profile.payoutLinked',
  'profile.saved',
  'profile.savedBody',
  'profile.savedEmailConfirm',
  'profile.enterAppFirst',
  'profile.enterAppFirstTitle',
  'profile.signOutTitle',
  'profile.signOutBody',
  'profile.signOut',
  'profileSetup.title',
  'profileSetup.body',
  'profileSetup.missingName',
  'profileSetup.missingPhone',
  'profileSetup.missingBank',
  'profileSetup.editProfile',
  'profileSetup.addBank',
  'profileSetup.bannerTitle',
  'profileSetup.bannerBody',
  'profileSetup.completeSetup',
  'profileSetup.reminderTitle',
  'profileSetup.reminderBody',
  'profileSetup.dismissReminder',
  'profileSetup.swipeToDismiss',
  'groups.notInApp',
  'groups.notInAppBody',
  'groups.noGroups',
  'groups.noGroupsMessage',
  'groups.active',
  'groups.settingUp',
  'groups.history',
  'contributions.title',
  'contributions.empty',
  'contributions.notInAppBody',
  'contributions.emptyMessage',
  'contributions.summary',
  'contributions.paid',
  'contributions.pending',
  'contributions.totalPaid',
  'contributions.tapToPay',
  'contributions.searchPlaceholder',
  'contributions.searchEmpty',
  'payments.transferToAdmin',
  'payments.cardPayDisabled',
  'payments.payoutDirect',
  'messages.emptyTitle',
  'messages.emptyMessage',
  'messages.memberFallback',
  'messages.youPrefix',
  'messages.sendMessage',
  'messages.sendTo',
  'messages.you',
  'messages.roleAdminContributor',
  'messages.roleMember',
  'messages.roleAdmin',
  'messages.roleAdminOrganizer',
  'messages.collected',
  'messages.collectingThisCycle',
  'messages.searchPlaceholder',
  'messages.searchEmpty',
  'messages.renameHint',
  'messages.saveNameTitle',
  'messages.saveNameHint',
  'messages.saveNameLabel',
  'messages.saveNamePlaceholder',
  'messages.saveNameClear',
  'messages.saveNameAction',
  'messages.profileNameLine',
  'messages.threadEmpty',
  'messages.inputPlaceholder',
  'messages.send',
  'messages.notInstalled',
  'messages.sendFailed',
  'notifications.title',
  'notifications.empty',
  'notifications.signInHint',
  'notifications.markAllRead',
  'notifications.filterTitle',
  'notifications.filterAll',
  'notifications.filterUnread',
  'notifications.filterPayments',
  'notifications.filterPayouts',
  'notifications.filterMembers',
  'notifications.filterEmpty',
  'notifications.notSetupTitle',
  'notifications.notSetupMessage',
  'notifications.emptyMessage',
  'auth.enterAppTitle',
  'auth.enterAppBody',
  'auth.continueAsGuest',
  'auth.signInEmail',
  'auth.loginTitle',
  'auth.signUpTitle',
  'auth.logInTitle',
  'auth.loginSubtitle',
  'auth.loginModeSubtitle',
  'auth.signUpModeSubtitle',
  'auth.alreadyHaveAccount',
  'auth.needAccountFirst',
  'auth.logInTab',
  'auth.signUpTab',
  'auth.logInButton',
  'auth.signUpButton',
  'auth.enterAppFooter',
  'auth.enterAppLoading',
  'auth.simpleLoginSubtitle',
  'auth.simpleLoginBody',
  'auth.enterAppButton',
  'auth.guestRecommend',
  'auth.enterAppNoEmail',
  'auth.emailOptionalDivider',
  'auth.emailLabel',
  'auth.emailPlaceholder',
  'auth.sendSignInEmail',
  'auth.sendSignInCode',
  'auth.enterEmailError',
  'auth.invalidEmail',
  'auth.passwordDivider',
  'auth.passwordLabel',
  'auth.passwordPlaceholder',
  'auth.confirmPasswordLabel',
  'auth.confirmPasswordPlaceholder',
  'auth.passwordMismatch',
  'auth.passwordTooShort',
  'auth.signInWithPassword',
  'auth.enterPasswordError',
  'auth.useEmailCodeInstead',
  'auth.usePasswordInstead',
  'auth.forgotPassword',
  'auth.resetPasswordSentTitle',
  'auth.resetPasswordSentBody',
  'auth.resetPasswordTitle',
  'auth.resetPasswordSubtitle',
  'auth.resetPasswordCodeSubtitle',
  'auth.resetPasswordCodeHint',
  'auth.resetPasswordButton',
  'auth.resetPasswordSuccessTitle',
  'auth.resetPasswordSuccessBody',
  'auth.resetPasswordNeedLink',
  'auth.linkEmailDivider',
  'auth.linkingGuestNote',
  'auth.linkEmailButton',
  'auth.resendWait',
  'auth.openEmailApp',
  'auth.backToSignIn',
  'auth.callbackSigningIn',
  'auth.callbackNoData',
  'auth.callbackFailed',
  'auth.couldNotEnterAppTitle',
  'auth.supabaseNotConfiguredTitle',
  'auth.supabaseNotConfiguredBody',
  'auth.supabaseNotConfiguredInline',
  'auth.requestAcceptedTitle',
  'auth.requestAcceptedBody',
  'auth.redirectHint',
  'auth.copyRedirectTitle',
  'auth.copyRedirectBody',
  'auth.tapToCopyRedirect',
  'auth.expoGoRedirectNote',
  'auth.noCodeTitle',
  'auth.noCodeStep1',
  'auth.noCodeStep2',
  'auth.noCodeStep3',
  'auth.skipEmailEnterApp',
  'auth.previewUiOnly',
  'auth.verifyTitle',
  'auth.verifySubtitle',
  'auth.verifyHelp',
  'auth.codeLabel',
  'auth.codePlaceholder',
  'auth.verifyCode',
  'auth.resendEmail',
  'auth.wrongEmailHint',
  'auth.noEmailTip',
  'auth.enterCodeError',
  'auth.configureSupabaseFirst',
  'auth.expoGoOpenWithHint',
  'auth.appLinkHint',
  'auth.orContinueWith',
  'auth.continueWithGoogle',
  'auth.continueWithApple',
  'auth.oauthFailed',
  'auth.oauthSetupHint',
  'auth.signInRequiredTitle',
  'auth.signInRequiredBody',
  'identityGate.title',
  'identityGate.body',
  'identityGate.verifyNow',
  'payoutOrder.title',
  'payoutOrder.subtitleAdmin',
  'payoutOrder.subtitleMember',
  'payoutOrder.tapToChange',
  'payoutOrder.collects',
  'payoutOrder.addRound',
  'payoutOrder.addRoundHint',
  'payoutOrder.saveOrder',
  'payoutOrder.unsaved',
  'payoutOrder.savedTitle',
  'payoutOrder.savedBody',
  'payoutOrder.changeCollectorTitle',
  'payoutOrder.changeCollectorHint',
  'payment.recordTitle',
  'payment.methodLabel',
  'payment.methodCash',
  'payment.methodTransfer',
  'payment.methodPos',
  'payment.methodOther',
  'payment.methodPaystack',
  'payment.methodUnknown',
  'payment.noteLabel',
  'payment.notePlaceholder',
  'payment.confirmRecord',
  'cycleSwap.title',
  'cycleSwap.subtitle',
  'cycleSwap.request',
  'cycleSwap.alreadyCollected',
  'cycleSwap.line',
  'cycleSwap.scheduledApproval',
  'cycleSwap.adminApproval',
  'cycleSwap.approve',
  'cycleSwap.approveAsAdmin',
  'cycleSwap.decline',
  'platform.noCustody',
  'payouts.notInAppBody',
  'payouts.summary',
  'payouts.totalReceived',
  'payouts.completed',
  'payouts.pending',
  'payouts.empty',
  'payouts.emptyMessage',
  'payouts.cycle',
  'payouts.received',
  'payouts.tapGroup',
  'account.preview',
  'account.guest',
  'account.signedIn',
  'account.notSignedIn',
  'push.enabled',
  'push.off',
  'push.notSet',
  'push.simulator',
  'push.disabled',
  'push.enabledAlertTitle',
  'push.enabledAlertBody',
  'push.deniedTitle',
  'push.deniedBody',
  'push.openSettings',
  'push.disable',
  'push.enabledTitle',
  'push.enabledBody',
  'push.simulatorTitle',
  'push.simulatorBody',
  'push.noProjectIdTitle',
  'push.noProjectIdBody',
  'push.dbErrorTitle',
  'push.dbErrorBody',
  'push.registerFailedTitle',
  'push.registerFailedBody',
  'reminders.title',
  'reminders.hint',
  'reminders.master',
  'reminders.masterHint',
  'reminders.contributions',
  'reminders.contributionsHint',
  'reminders.overdue',
  'reminders.overdueHint',
  'reminders.payouts',
  'reminders.payoutsHint',
  'reminders.timeTitle',
  'reminders.timeHint',
  'reminders.timeSelected',
  'reminders.on',
  'reminders.off',
  'reminders.setupTitle',
  'reminders.setupBody',
  'reminders.saveFailedTitle',
  'reminders.saveFailedBody',
  'language.title',
  'language.hint',
  'language.selected',
  'language.changed',
  'theme.title',
  'theme.hint',
  'theme.appearanceTitle',
  'theme.backgroundTitle',
  'theme.backgroundHint',
  'theme.background.default',
  'theme.background.light',
  'theme.background.warm',
  'theme.background.cool',
  'theme.background.purple',
  'theme.system',
  'theme.light',
  'theme.dark',
  'theme.selected',
  'security.appLock.title',
  'security.appLock.hint',
  'security.appLock.toggle',
  'security.appLock.toggleHint',
  'security.appLock.on',
  'security.appLock.off',
  'security.appLock.unavailableTitle',
  'security.appLock.unavailableBody',
  'security.appLock.enablePrompt',
  'security.appLock.disablePrompt',
  'security.appLock.enableFailedTitle',
  'security.appLock.enableFailedBody',
  'security.appLock.unlockTitle',
  'security.appLock.unlockHint',
  'security.appLock.unlockButton',
  'security.appLock.unlocking',
  'security.appLock.expoGoNotice',
  'security.appLock.expoGoToggleHint',
  'security.appLock.passcodeOnlyNotice',
  'security.pin.title',
  'security.pin.hint',
  'security.pin.set',
  'security.pin.change',
  'security.pin.remove',
  'security.pin.current',
  'security.pin.new',
  'security.pin.confirm',
  'security.pin.confirmHint',
  'security.pin.enterHint',
  'security.pin.mismatchTitle',
  'security.pin.mismatch',
  'security.pin.wrongPin',
  'security.pin.wrongPinTitle',
  'security.pin.savedTitle',
  'security.pin.savedBody',
  'security.pin.removedTitle',
  'security.pin.removedBody',
  'security.pin.removeConfirmTitle',
  'security.pin.removeConfirmBody',
  'security.pin.saveFailedTitle',
  'security.pin.saveFailedBody',
  'security.pin.on',
  'security.pin.off',
  'security.pin.verifyTitle',
  'security.pin.verifyHint',
  'security.signIn.title',
  'security.signIn.hint',
  'security.signIn.passwordlessTitle',
  'security.signIn.passwordlessBody',
  'security.signIn.guestTitle',
  'security.signIn.guestBody',
  'security.signIn.sendCode',
  'security.signIn.emailSentTitle',
  'security.signIn.emailSentBody',
  'security.signIn.switchEmail',
  'security.signIn.sendFailedTitle',
  'security.password.set',
  'security.password.change',
  'security.password.hint',
  'security.password.accountEmail',
  'security.password.guestHint',
  'security.password.savedTitle',
  'security.password.savedBody',
  'security.devices.title',
  'security.devices.hint',
  'security.devices.thisDevice',
  'security.devices.os',
  'security.devices.appVersion',
  'security.devices.signedIn',
  'security.devices.signOutOthers',
  'security.devices.signOutOthersConfirmTitle',
  'security.devices.signOutOthersConfirmBody',
  'security.devices.signOutOthersDoneTitle',
  'security.devices.signOutOthersDoneBody',
  'security.devices.signOutEverywhere',
  'security.devices.signOutEverywhereConfirmTitle',
  'security.devices.signOutEverywhereConfirmBody',
  'security.devices.actionFailedTitle',
  'help.hint',
  'help.footer',
  'help.faq1q',
  'help.faq1a',
  'help.faq2q',
  'help.faq2a',
  'help.faq3q',
  'help.faq3a',
  'help.faq4q',
  'help.faq4a',
  'help.faq5q',
  'help.faq5a',
  'support.hint',
  'support.emailLabel',
  'support.responseHint',
  'support.openEmail',
  'support.copyEmail',
  'support.copiedTitle',
  'support.copiedBody',
  'terms.lastUpdated',
  'terms.intro',
  'terms.section1Title',
  'terms.section1Body',
  'terms.section2Title',
  'terms.section2Body',
  'terms.privacyTitle',
  'terms.privacyBody',
  'about.tagline',
  'about.version',
  'about.missionTitle',
  'about.missionBody',
  'identity.statusLabel',
  'identity.hint',
  'identity.statusNotStarted',
  'identity.statusInReview',
  'identity.statusVerified',
  'identity.previewBadge',
  'identity.placeholderTitle',
  'identity.placeholderBody',
  'identity.step1Title',
  'identity.step1Body',
  'identity.realKycTitle',
  'identity.realKycBody',
  'identity.missingName',
  'identity.missingPhone',
  'identity.missingEmail',
  'identity.editProfileButton',
  'identity.startButton',
  'identity.completeButton',
  'identity.completeButtonOtpOnly',
  'identity.submitButton',
  'identity.confirmTitle',
  'identity.confirmBody',
  'identity.submittedTitle',
  'identity.submittedBody',
  'identity.reviewNote',
  'identity.verifiedNote',
  'identity.verifiedPreviewNote',
  'identity.verifiedOtpNote',
  'identity.verifiedYouverifyNote',
  'identity.otpBadge',
  'identity.ninBadge',
  'identity.stepProfile',
  'identity.stepPhone',
  'identity.stepEmail',
  'identity.stepNin',
  'identity.adminRequirementNote',
  'identity.ninTitle',
  'identity.ninBody',
  'identity.ninSandboxHint',
  'identity.ninLabel',
  'identity.ninSelfieLabel',
  'identity.ninSelfiePlaceholder',
  'identity.ninTakeSelfie',
  'identity.ninRetakeSelfie',
  'identity.ninConsentLabel',
  'identity.ninSubmitButton',
  'identity.ninInvalidTitle',
  'identity.ninInvalidBody',
  'identity.ninConsentTitle',
  'identity.ninConsentBody',
  'identity.ninSelfieRequiredTitle',
  'identity.ninSelfieRequiredBody',
  'identity.ninSelfieFailedTitle',
  'identity.ninSelfiePermission',
  'identity.ninFailedTitle',
  'identity.quickVerifyTitle',
  'identity.quickVerifyBody',
  'identity.quickVerifyButton',
  'otp.phoneTitle',
  'otp.phoneSubtitle',
  'otp.phoneVerified',
  'otp.emailTitle',
  'otp.emailSubtitle',
  'otp.emailVerified',
  'otp.sendCode',
  'otp.sentPhone',
  'otp.sentEmail',
  'otp.codeLabel',
  'otp.codePlaceholder',
  'otp.verifyCode',
  'otp.expiryHint',
  'otp.devCodeHint',
  'otp.devModePhoneTitle',
  'otp.devModePhoneBody',
  'otp.devModeEmailTitle',
  'otp.devModeEmailBody',
  'otp.devModeVerifyHint',
  'otp.devCodeTapCopy',
  'otp.devCodeCopyA11y',
  'otp.devCodeCopiedTitle',
  'otp.devCodeCopiedBody',
  'otp.sendFailedTitle',
  'otp.verifyFailedTitle',
  'otp.missingCodeTitle',
  'otp.missingCodeBody',
  'otp.verifiedTitle',
  'groupAdmin.verifyRequiredTitle',
  'groupAdmin.verifyRequiredNotStarted',
  'groupAdmin.verifyRequiredInReview',
  'groupAdmin.verifyButton',
  'admin.modeLabel',
  'admin.modeManaging',
  'admin.modeParticipating',
  'admin.modeSwitch',
  'admin.dashboardTitle',
  'admin.dashboardSubtitle',
  'admin.cardBrand',
  'admin.cardHolder',
  'admin.cardTapHint',
  'admin.quickEarnings',
  'admin.kpiGroups',
  'admin.kpiActiveCount_one',
  'admin.kpiActiveCount_other',
  'admin.kpiCompletedCount_one',
  'admin.kpiCompletedCount_other',
  'admin.kpiMembers',
  'admin.kpiReceived',
  'admin.kpiEarnings',
  'admin.totalCollected',
  'admin.kpiOutstanding',
  'admin.kpiPending',
  'admin.kpiPayouts',
  'admin.createGroup',
  'admin.viewLedger',
  'admin.groupHealth',
  'admin.managedGroups_one',
  'admin.managedGroups_other',
  'admin.noActiveGroupsShort',
  'admin.noActiveGroupsShort_one',
  'admin.noActiveGroupsShort_other',
  'admin.groupCollected',
  'admin.groupEarned',
  'admin.groupCycles_one',
  'admin.groupCycles_other',
  'admin.groupDraftHint_one',
  'admin.groupDraftHint_other',
  'admin.groupPendingCount_one',
  'admin.groupPendingCount_other',
  'admin.groupProgress',
  'admin.nextPayout',
  'admin.dateTbd',
  'admin.noGroupsYet',
  'admin.noGroupsHint',
  'admin.noActiveGroupsHint',
  'admin.dashboardLoadErrorTitle',
  'admin.dashboardLoadErrorMessage',
  'admin.tryAgain',
  'admin.verifyIdentity',
  'admin.recentActivity',
  'admin.ledgerIntro',
  'admin.searchLabel',
  'admin.searchPlaceholder',
  'admin.filterAll',
  'admin.filterPending',
  'admin.filterPaid',
  'admin.filterFailed',
  'admin.ledgerEmpty',
  'admin.cycleLabel',
  'admin.payoutsIntro',
  'admin.payoutsEmpty',
  'admin.readyPayout',
  'admin.collecting',
  'admin.moreOperations',
  'admin.moreAccount',
  'admin.membersHub',
  'admin.transparencyCenter',
  'admin.reports',
  'admin.currentPlan',
  'admin.moreFooter',
  'admin.transparencyTitle',
  'admin.transparencySubtitle',
  'admin.transparencyEmpty',
  'admin.payContribution',
  'admin.viewSchedule',
  'admin.groupAdminTitle',
  'admin.groupAdminDenied',
  'admin.groupAdminSubtitle',
  'admin.manageGroup',
  'admin.inviteMembers',
  'admin.groupNotes',
];
