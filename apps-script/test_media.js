/**
 * Test the media generation with a dummy story
 * Run this to verify API keys and Drive access
 */
function testMediaPipeline() {
    logMessage('=== Starting Media Pipeline Test ===', 'INFO');

    const dummyStory = {
        title: "Test Story " + new Date().getTime(),
        scenes: [
            "A happy blue cat sits on a red mat in a sunny garden."
        ]
    };

    logMessage('1. Testing Image Generation...', 'INFO');
    const imageResult = generateSceneImage(dummyStory.scenes[0], dummyStory.title);
    logMessage('Image Result: ' + (imageResult.success ? '✅ SUCCESS' : '❌ FAILED: ' + imageResult.error), imageResult.success ? 'INFO' : 'ERROR');

    logMessage('2. Testing Voice Generation...', 'INFO');
    const voiceResult = generateVoiceover(dummyStory.scenes[0], 'en');
    logMessage('Voice Result: ' + (voiceResult.success ? '✅ SUCCESS' : '❌ FAILED: ' + voiceResult.error), voiceResult.success ? 'INFO' : 'ERROR');

    if (imageResult.success && voiceResult.success) {
        logMessage('✅ ALL SYSTEM TESTS PASSED! Media generation is working perfectly.', 'INFO');
        logMessage('You can now run "runFullPipeline" or use the Dashboard button.', 'INFO');
    } else {
        logMessage('❌ TESTS FAILED. Please check API keys in Config sheet.', 'ERROR');
    }
}
