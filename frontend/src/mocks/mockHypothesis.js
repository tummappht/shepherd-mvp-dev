export const mockMessage = [
  {
    from: "system",
    text: "Starting vulnerability analysis pipeline...",
    type: "description",
  },
  {
    from: "system",
    text: "Successfully loaded assets from: /app/byor/deployments/alchemix-v2-dao. Funding agents via tunnel...",
    type: "description",
  },
  {
    from: "system",
    text: "Funding all accounts via tunnel...",
    type: "description",
  },
  {
    from: "system",
    text: "Funding 2 agent addresses first...",
    type: "description",
  },
  {
    from: "system",
    text: "Funding agent address: PLAYER_ADDRESS (0x4C1f023A2A914d109bEa600aB518f3078466e279)",
    type: "description",
  },
  {
    from: "system",
    text: "Balance before: 10.000000 ETH",
    type: "description",
  },
  {
    from: "system",
    text: "Balance after: 10.000000 ETH",
    type: "description",
  },
  {
    from: "system",
    text: "✅ Successfully funded PLAYER_ADDRESS",
    type: "description",
  },
  {
    from: "system",
    text: "Funding agent address: DEPLOYER_ADDRESS (0xB3D455378ee5cb840e5bc9f399d399f2601c6d48)",
    type: "description",
  },
  {
    from: "system",
    text: "Balance before: 10.000000 ETH",
    type: "description",
  },
  {
    from: "system",
    text: "Balance after: 10.000000 ETH",
    type: "description",
  },
  {
    from: "system",
    text: "✅ Successfully funded DEPLOYER_ADDRESS",
    type: "description",
  },
  {
    from: "system",
    text: "Funding Results Summary:",
    type: "description",
  },
  {
    from: "system",
    text: "Total accounts: 10",
    type: "description",
  },
  {
    from: "system",
    text: "Successfully funded: 10",
    type: "description",
  },
  {
    from: "system",
    text: "Funded 10/10 accounts successfully",
    type: "description",
  },
  {
    from: "system",
    text: "Tunneling funding process completed!",
    type: "description",
  },
  {
    from: "system",
    text: "Deployed files location: /app/byor/deployments/alchemix-v2-dao. Processing repository: alchemix-v2-dao...",
    type: "description",
  },
  {
    from: "system",
    text: "Successfully chunked repository: alchemix-v2-dao",
    type: "description",
  },
  {
    from: "system",
    text: "Starting MAS iteration...",
    type: "description",
  },
  {
    from: "system",
    text: "Starting targeted vulnerability analysis workflow...",
    type: "description",
  },
  {
    from: "system",
    text: "Enter your detailed vulnerability hypothesis",
    type: "prompt",
  },
  {
    from: "user",
    text: "A user can grow unclaimedFlux without bound by repeatedly creating a new “dust” veNFT, merging the previous veNFT into the new one, and calling reset again each time, all without ever voting. First approve BPT for the VotingEscrow contract, create an initial lock to obtain a first token (the previous token), and call Voter.reset on it to establish a baseline unclaimedFlux value. Then for a fixed number of iterations such as ten, create a new dust lock to obtain a next token, call VotingEscrow.merge from the previous token into the next token so that FluxToken.mergeFlux transfers the accumulated unclaimedFlux and zeroes the source, call Voter.reset on the next token to accrue again, and read unclaimedFlux to confirm it strictly increases compared to the prior reading. After the loop, assert that the final unclaimedFlux is roughly linear in the number of iterations relative to the baseline (for example final is at least ten times the baseline). Proving the ever-increasing unclaimedFlux is sufficient; claiming ERC-20 Flux is not required.",
  },
  {
    from: "system",
    text: "CONTRACT/CHUNK 1",
    type: "description",
  },
  {
    from: "system",
    text: "Enter the contract name (e.g., Vault, BuyPurpose):",
    type: "prompt",
  },
  {
    from: "user",
    text: "VotingEscrow",
  },
  {
    from: "system",
    text: "Enter the specific function or area (e.g., withdraw, constructor):",
    type: "prompt",
  },
  {
    from: "user",
    text: "merge",
  },
  {
    from: "system",
    text: "Found contract 'VotingEscrow' with ID: 00d5d28a-06a5-466a-a510-61e8ee983a10",
    type: "description",
  },
  {
    from: "system",
    text: "COMPLETE CHUNK METADATA",
    type: "description",
  },
  {
    from: "system",
    text: '{\n  "chunk_id": "5bf22ab5-1ee1-4a61-9e9d-32c0fdf19b95",\n  "contract_id": "00d5d28a-06a5-466a-a510-61e8ee983a10",\n  "chunk_type": "function_definition",\n  "name": "merge",\n  "start_line": 618,\n  "end_line": 651,\n  "source_code": "function merge(uint256 _from, uint256 _to) external {\\n        require(!voted[_from], \\"voting in progress for token\\");\\n        require(_from != _to, \\"must be different tokens\\");\\n        require(_isApprovedOrOwner(msg.sender, _from), \\"not approved or owner\\");\\n        require(_isApprovedOrOwner(msg.sender, _to), \\"not approved or owner\\");\\n\\n        LockedBalance memory _locked0 = locked[_from];\\n        LockedBalance memory _locked1 = locked[_to];\\n\\n        // Cannot merge if cooldown is active or lock is expired\\n        require(_locked0.cooldown == 0, \\"Cannot merge when cooldown period in progress\\");\\n        require(_locked1.cooldown == 0, \\"Cannot merge when cooldown period in progress\\");\\n        require(_locked0.end > block.timestamp, \\"Cannot merge when lock expired\\");\\n        require(_locked1.end > block.timestamp, \\"Cannot merge when lock expired\\");\\n\\n        uint256 value0 = uint256(_locked0.amount);\\n\\n        // If max lock is enabled retain the max lock\\n        _locked1.maxLockEnabled = _locked0.maxLockEnabled ? _locked0.maxLockEnabled : _locked1.maxLockEnabled;\\n\\n        IFluxToken(FLUX).mergeFlux(_from, _to);\\n\\n        // If max lock is enabled end is the max lock time, otherwise it is the greater of the two end times\\n        uint256 end = _locked1.maxLockEnabled\\n            ? ((block.timestamp + MAXTIME) / WEEK) * WEEK\\n            : _locked0.end >= _locked1.end\\n            ? _locked0.end\\n            : _locked1.end;\\n\\n        locked[_from] = LockedBalance(0, 0, false, 0);\\n        _checkpoint(_from, _locked0, LockedBalance(0, 0, false, 0));\\n        _burn(_from, value0);\\n        _depositFor(_to, value0, end, _locked1.maxLockEnabled, _locked1, DepositType.MERGE_TYPE);\\n    }",\n  "metadata": {\n    "descriptive_id": "function_definition_merge_line_618",\n    "visibility": "external",\n    "mutability": null,\n    "modifier_list": [],\n    "parameters": [],\n    "return_type": null,\n    "source_file": "VotingEscrow_0xa513\\u2026c853.json",\n    "file_path": null\n  }\n}',
    type: "description",
  },
  {
    from: "system",
    text: "🟢 SAFE | Current: 760 tokens (0.4%) | After adding: 760 tokens (0.4%) | Limit: 200,000 tokens",
    type: "description",
  },
  {
    from: "system",
    text: "Add another contract/chunk? (y/n):",
    type: "prompt",
  },
  {
    from: "user",
    text: "y",
  },
  {
    from: "system",
    text: "CONTRACT/CHUNK 2",
    type: "description",
  },
  {
    from: "system",
    text: "Enter the contract name (e.g., Vault, BuyPurpose):",
    type: "prompt",
  },
  {
    from: "user",
    text: "FluxToken",
  },
  {
    from: "system",
    text: "Enter the specific function or area (e.g., withdraw, constructor):",
    type: "prompt",
  },
  {
    from: "user",
    text: "mergeFlux",
  },
  {
    from: "system",
    text: "Found contract 'FluxToken' with ID: 01455859-ddc9-4c7f-ba94-8d2e5f7f52fb",
    type: "description",
  },
  {
    from: "system",
    text: "COMPLETE CHUNK METADATA",
    type: "description",
  },
  {
    from: "system",
    text: '{\n  "chunk_id": "2976b6e5-553d-4cc5-836c-539bdc292eff",\n  "contract_id": "01455859-ddc9-4c7f-ba94-8d2e5f7f52fb",\n  "chunk_type": "function_definition",\n  "name": "mergeFlux",\n  "start_line": 180,\n  "end_line": 185,\n  "source_code": "function mergeFlux(uint256 _fromTokenId, uint256 _toTokenId) external {\\n        require(msg.sender == veALCX, \\"not veALCX\\");\\n\\n        unclaimedFlux[_toTokenId] += unclaimedFlux[_fromTokenId];\\n        unclaimedFlux[_fromTokenId] = 0;\\n    }",\n  "metadata": {\n    "descriptive_id": "function_definition_mergeFlux_line_180",\n    "visibility": "external",\n    "mutability": null,\n    "modifier_list": [],\n    "parameters": [],\n    "return_type": null,\n    "source_file": "MockBPT_0x5fbd\\u20260aa3.json",\n    "file_path": null\n  }\n}',
    type: "description",
  },
  {
    from: "system",
    text: "🟢 SAFE | Current: 938 tokens (0.5%) | After adding: 938 tokens (0.5%) | Limit: 200,000 tokens",
    type: "description",
  },
  {
    from: "system",
    text: "Add another contract/chunk? (y/n):",
    type: "prompt",
  },
  {
    from: "user",
    text: "t",
  },
  {
    from: "system",
    text: "FINAL INPUT SUMMARY",
    type: "description",
  },
  {
    from: "system",
    text: "Detailed Hypothesis: A user can grow unclaimedFlux without bound by repeatedly creating a new “dust” veNFT, merging the previous veNFT into the new one, and calling reset again each time, all without ever voting. First approve BPT for the VotingEscrow contract, create an initial lock to obtain a first token (the previous token), and call Voter.reset on it to establish a baseline unclaimedFlux value. Then for a fixed number of iterations such as ten, create a new dust lock to obtain a next token, call VotingEscrow.merge from the previous token into the next token so that FluxToken.mergeFlux transfers the accumulated unclaimedFlux and zeroes the source, call Voter.reset on the next token to accrue again, and read unclaimedFlux to confirm it strictly increases compared to the prior reading. After the loop, assert that the final unclaimedFlux is roughly linear in the number of iterations relative to the baseline (for example final is at least ten times the baseline). Proving the ever-increasing unclaimedFlux is sufficient; claiming ERC-20 Flux is not required.",
    type: "description",
  },
  {
    from: "system",
    text: "Contracts and Chunks (2 total):",
    type: "description",
  },
  {
    from: "system",
    text: "  1. VotingEscrow.merge (532 tokens)",
    type: "description",
  },
  {
    from: "system",
    text: "  2. FluxToken.mergeFlux (178 tokens)",
    type: "description",
  },
  {
    from: "system",
    text: "Token Usage Summary:\n  Hypothesis: 228 tokens\n  Contract/Chunk data: 710 tokens\n  Total estimated: 938 tokens\n  Context limit: 200,000 tokens\n  Usage percentage: 0.5%",
    type: "description",
  },
  {
    from: "system",
    text: "Found contract 'VotingEscrow' with ID: 00d5d28a-06a5-466a-a510-61e8ee983a10",
    type: "description",
  },
  {
    from: "system",
    text: "COMPLETE CHUNK METADATA",
    type: "description",
  },
  {
    from: "system",
    text: '{\n  "chunk_id": "5bf22ab5-1ee1-4a61-9e9d-32c0fdf19b95",\n  "contract_id": "00d5d28a-06a5-466a-a510-61e8ee983a10",\n  "chunk_type": "function_definition",\n  "name": "merge",\n  "start_line": 618,\n  "end_line": 651,\n  "source_code": "function merge(uint256 _from, uint256 _to) external {\\n        require(!voted[_from], \\"voting in progress for token\\");\\n        require(_from != _to, \\"must be different tokens\\");\\n        require(_isApprovedOrOwner(msg.sender, _from), \\"not approved or owner\\");\\n        require(_isApprovedOrOwner(msg.sender, _to), \\"not approved or owner\\");\\n\\n        LockedBalance memory _locked0 = locked[_from];\\n        LockedBalance memory _locked1 = locked[_to];\\n\\n        // Cannot merge if cooldown is active or lock is expired\\n        require(_locked0.cooldown == 0, \\"Cannot merge when cooldown period in progress\\");\\n        require(_locked1.cooldown == 0, \\"Cannot merge when cooldown period in progress\\");\\n        require(_locked0.end > block.timestamp, \\"Cannot merge when lock expired\\");\\n        require(_locked1.end > block.timestamp, \\"Cannot merge when lock expired\\");\\n\\n        uint256 value0 = uint256(_locked0.amount);\\n\\n        // If max lock is enabled retain the max lock\\n        _locked1.maxLockEnabled = _locked0.maxLockEnabled ? _locked0.maxLockEnabled : _locked1.maxLockEnabled;\\n\\n        IFluxToken(FLUX).mergeFlux(_from, _to);\\n\\n        // If max lock is enabled end is the max lock time, otherwise it is the greater of the two end times\\n        uint256 end = _locked1.maxLockEnabled\\n            ? ((block.timestamp + MAXTIME) / WEEK) * WEEK\\n            : _locked0.end >= _locked1.end\\n            ? _locked0.end\\n            : _locked1.end;\\n\\n        locked[_from] = LockedBalance(0, 0, false, 0);\\n        _checkpoint(_from, _locked0, LockedBalance(0, 0, false, 0));\\n        _burn(_from, value0);\\n        _depositFor(_to, value0, end, _locked1.maxLockEnabled, _locked1, DepositType.MERGE_TYPE);\\n    }",\n  "metadata": {\n    "descriptive_id": "function_definition_merge_line_618",\n    "visibility": "external",\n    "mutability": null,\n    "modifier_list": [],\n    "parameters": [],\n    "return_type": null,\n    "source_file": "VotingEscrow_0xa513\\u2026c853.json",\n    "file_path": null\n  }\n}',
    type: "description",
  },
  {
    from: "system",
    text: "Found contract 'FluxToken' with ID: 01455859-ddc9-4c7f-ba94-8d2e5f7f52fb",
    type: "description",
  },
  {
    from: "system",
    text: "COMPLETE CHUNK METADATA",
    type: "description",
  },
  {
    from: "system",
    text: '{\n  "chunk_id": "2976b6e5-553d-4cc5-836c-539bdc292eff",\n  "contract_id": "01455859-ddc9-4c7f-ba94-8d2e5f7f52fb",\n  "chunk_type": "function_definition",\n  "name": "mergeFlux",\n  "start_line": 180,\n  "end_line": 185,\n  "source_code": "function mergeFlux(uint256 _fromTokenId, uint256 _toTokenId) external {\\n        require(msg.sender == veALCX, \\"not veALCX\\");\\n\\n        unclaimedFlux[_toTokenId] += unclaimedFlux[_fromTokenId];\\n        unclaimedFlux[_fromTokenId] = 0;\\n    }",\n  "metadata": {\n    "descriptive_id": "function_definition_mergeFlux_line_180",\n    "visibility": "external",\n    "mutability": null,\n    "modifier_list": [],\n    "parameters": [],\n    "return_type": null,\n    "source_file": "MockBPT_0x5fbd\\u20260aa3.json",\n    "file_path": null\n  }\n}',
    type: "description",
  },
  {
    from: "system",
    text: "Creating analysis graph with targeted planning...",
    type: "description",
  },
  {
    from: "system",
    text: "Registering source code with static analysis tools...",
    type: "description",
  },
  {
    from: "system",
    text: "Preparing contract metadata for analysis...",
    type: "description",
  },
  {
    from: "system",
    text: "Starting graph execution with enhanced recursion limits... Graph execution completed, processing results...",
    type: "description",
  },
  {
    from: "system",
    text: "Starting vulnerability analysis planning...",
    type: "description",
  },
  {
    from: "system",
    text: "Processing 2 contract/chunk pairs\n• Estimated token usage: 938 tokens (0.5%)",
    type: "description",
  },
  {
    from: "system",
    text: "Performing feasibility assessment for multiple contracts...",
    type: "description",
  },
  {
    from: "system",
    text: "Feasibility assessment completed!",
    type: "description",
  },
  {
    from: "system",
    text: "Generating comprehensive analysis plan using available tools...",
    type: "description",
  },
  {
    from: "system",
    text: "Analysis plan generated successfully!",
    type: "description",
  },
  {
    from: "system",
    text: '1. First, establish the preconditions by having our agent approve the VotingEscrow contract to spend BPT tokens. Use the MockBPT contract (address 0x5FbDB2315678afecb367f032d93F642f64180aa3) since VotingEscrow uses its BPT value. Call the “approve” function on MockBPT to allow VotingEscrow (address 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853) to spend a sufficiently large amount (e.g. 1,000,000 “units”).  \n   • Tool: functions.send_transaction_tool  \n   • Arguments:  \n  contract_address: "0x5FbDB2315678afecb367f032d93F642f64180aa3"  \n  function_name: "approve"  \n  function_args: [ "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853", "1000000" ]',
    type: "planner-step",
  },
  {
    from: "system",
    text: '2. Create the initial “baseline” veNFT lock using VotingEscrow. Call the “createLock” function on the VotingEscrow contract (address 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853) with a substantial deposit (e.g. 1000 units) and a lock duration greater than one epoch (e.g. 30 days). Capture the returned token ID as the “previous token.”  \n   • Tool: functions.send_transaction_tool  \n   • Arguments:  \n  contract_address: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"  \n  function_name: "createLock"  \n  function_args: [ "1000", "2592000", "false" ]  \n   (Note: "2592000" seconds is equivalent to 30 days.)',
    type: "planner-step",
  },
  {
    from: "system",
    text: '3. Call the “reset” function on the Voter contract (address 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6) for the baseline token, so that the VotingEscrow resets that token and triggers accrual of unclaimedFlux.  \n   • Tool: functions.send_transaction_tool  \n   • Arguments:  \n  contract_address: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"  \n  function_name: "reset"  \n  function_args: [ baseline_token_id ]  \n   (Replace baseline_token_id with the token ID output from step 2.)',
    type: "planner-step",
  },
  {
    from: "system",
    text: '4. Read the baseline unclaimedFlux for the baseline token from the FluxToken contract (address 0x0165878A594ca255338adfa4d48449f69242Eb8F). Use the automatically generated getter for the public mapping “unclaimedFlux” with the baseline token ID. Record this value as “baselineFlux.”  \n   • Tool: functions.call_view_tool  \n   • Arguments:  \n  contract_address: "0x0165878A594ca255338adfa4d48449f69242Eb8F"  \n  function_name: "unclaimedFlux"  \n  function_args: [ baseline_token_id ]',
    type: "planner-step",
  },
  {
    from: "system",
    text: '5. For each iteration i = 1 to 10 (simulating the “dust” process):  \n   a. Create a new “dust” lock (a very low deposit value, e.g. 1 unit) using VotingEscrow.createLock to obtain a new token (“next token”).  \n      • Tool: functions.send_transaction_tool  \n      • Arguments:  \n  contract_address: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"  \n  function_name: "createLock"  \n  function_args: [ "1", "2592000", "false" ]  \n   (Note: Using a 30-day duration for consistency.)  \n      \n   b. Merge the previous token (from the prior iteration; for i = 1 the previous token is the baseline token) into this new token by calling VotingEscrow.merge. This action will invoke FluxToken.mergeFlux internally and transfer the accumulated unclaimedFlux from the source token into the new token.  \n      • Tool: functions.send_transaction_tool  \n      • Arguments:  \n  contract_address: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"  \n  function_name: "merge"  \n  function_args: [ previous_token_id, new_token_id ]  \n      \n   c. Call the “reset” function on the Voter contract for the new token, to trigger accrual of additional unclaimedFlux for it.  \n      • Tool: functions.send_transaction_tool  \n      • Arguments:  \n  contract_address: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"  \n  function_name: "reset"  \n  function_args: [ new_token_id ]  \n      \n   d. Query the FluxToken.unclaimedFlux value for the new token and record it as the accumulated flux for this iteration.  \n      • Tool: functions.call_view_tool  \n      • Arguments:  \n  contract_address: "0x0165878A594ca255338adfa4d48449f69242Eb8F"  \n  function_name: "unclaimedFlux"  \n  function_args: [ new_token_id ]  \n      \n   e. Set “previous_token_id” = new_token_id for the next iteration.',
    type: "planner-step",
  },
  {
    from: "system",
    text: "6. After completing the 10 iterations, compare the final unclaimedFlux value with the baselineFlux recorded in step 4. Verify that the final flux is roughly linear with the number of iterations; for example, assert that final_flux ≥ (baselineFlux × 10).",
    type: "planner-step",
  },
  {
    from: "system",
    text: "7. Finally, document the observations from each iteration (the unclaimedFlux values) and confirm that the accumulation follows the hypothesized pattern.\n\nThis step-by-step plan leverages the VotingEscrow.merge function (which checks cooldowns, lock expiration, and then calls FluxToken.mergeFlux) and the FluxToken.mergeFlux implementation (which simply adds the unclaimedFlux from the source token and zeroes it out) to test whether repeated merging and resetting results in unbounded growth of unclaimedFlux.",
    type: "planner-step",
  },
  {
    from: "system",
    text: "Calling tool send_transaction_tool",
    type: "executor-tool-call",
  },
  {
    from: "system",
    text: "send_transaction_tool: success - {}",
    type: "executor-tool-result",
  },
  {
    from: "system",
    text: "Calling tool send_transaction_tool",
    type: "executor-tool-call",
  },
  {
    from: "system",
    text: "send_transaction_tool: failed - None",
    type: "executor-tool-result",
  },
  {
    from: "system",
    text: "Starting reflection phase to analyze results... Analyzing execution results and planning next steps...",
    type: "description",
  },
  {
    from: "system",
    text: "Reflection completed!",
    type: "description",
  },
  {
    from: "system",
    text: "reflector agent:\nThe error indicates that the function arguments provided to createLock were not of the correct type. VotingEscrow.createLock expects (uint256, uint256, bool), but the arguments were provided as strings. To fix this, we must pass the first two values as numbers and the boolean value as a boolean (i.e. false without quotes). \n\nI will now re-submit the createLock transaction with the corrected types: [1000, 2592000, false].",
    type: "agent",
  },
  {
    from: "system",
    text: "Starting vulnerability analysis planning...",
    type: "description",
  },
  {
    from: "system",
    text: "Processing 2 contract/chunk pairs\n• Estimated token usage: 938 tokens (0.5%)",
    type: "description",
  },
  {
    from: "system",
    text: "Performing feasibility assessment for multiple contracts...",
    type: "description",
  },
  {
    from: "system",
    text: "Feasibility assessment completed!",
    type: "description",
  },
  {
    from: "system",
    text: "Generating comprehensive analysis plan using available tools...",
    type: "description",
  },
  {
    from: "system",
    text: "Analysis plan generated successfully!",
    type: "description",
  },
  {
    from: "system",
    text: "Calling tool send_transaction_tool",
    type: "executor-tool-call",
  },
  {
    from: "system",
    text: "send_transaction_tool: success - {}",
    type: "executor-tool-result",
  },
  {
    from: "system",
    text: "Starting vulnerability analysis planning...",
    type: "description",
  },
  {
    from: "system",
    text: "Processing 2 contract/chunk pairs\n• Estimated token usage: 938 tokens (0.5%)",
    type: "description",
  },
  {
    from: "system",
    text: "Performing feasibility assessment for multiple contracts...",
    type: "description",
  },
  {
    from: "system",
    text: "Feasibility assessment completed!",
    type: "description",
  },
  {
    from: "system",
    text: "Generating comprehensive analysis plan using available tools...",
    type: "description",
  },
  {
    from: "system",
    text: "Analysis plan generated successfully!",
    type: "description",
  },
  {
    from: "system",
    text: "Calling tool send_transaction_tool",
    type: "executor-tool-call",
  },
  {
    from: "system",
    text: "send_transaction_tool: success - {}",
    type: "executor-tool-result",
  },
  {
    from: "system",
    text: "Starting vulnerability analysis planning...",
    type: "description",
  },
  {
    from: "system",
    text: "Processing 2 contract/chunk pairs\n• Estimated token usage: 938 tokens (0.5%)",
    type: "description",
  },
  {
    from: "system",
    text: "Performing feasibility assessment for multiple contracts...",
    type: "description",
  },
  {
    from: "system",
    text: "Feasibility assessment completed!",
    type: "description",
  },
  {
    from: "system",
    text: "Generating comprehensive analysis plan using available tools...",
    type: "description",
  },
  {
    from: "system",
    text: "Analysis plan generated successfully!",
    type: "description",
  },
  {
    from: "system",
    text: "Below is the detailed step‐by‐step plan (with explicit tool calls and required arguments) that tests the hypothesis by “growing” the unclaimedFlux through repeated dust‐merges and resets. In summary, the plan first approves BPT spending, then creates an initial (baseline) lock and calls Voter.reset on it so that we capture its baseline unclaimedFlux. Then, in a loop of (for example) 10 iterations, a new “dust” lock is created, the previous token is merged into the new one (thereby transferring its accumulated unclaimedFlux via FluxToken.mergeFlux), and Voter.reset is called on the new token so that additional flux accrues. Finally, the recorded unclaimedFlux for the final token is compared with the baseline (expecting at least 10× the baseline).\n\nBelow are the steps:\n\n────────────────────────────",
    type: "planner-step",
  },
  {
    from: "system",
    text: 'Step 1. Approve VotingEscrow to spend BPT\n• Use the MockBPT token’s “approve” function so that VotingEscrow (address 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853) may spend (for example) 1,000,000 units.\nTool: functions.send_transaction_tool  \nArguments:\n contract_address: "0x5FbDB2315678afecb367f032d93F642F64180aa3"  \n function_name: "approve"  \n function_args: [ "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853", "1000000" ]\n\n────────────────────────────',
    type: "planner-step",
  },
  {
    from: "system",
    text: 'Step 2. Create the initial (baseline) lock\n• Call VotingEscrow.createLock (which expects three parameters: a deposit amount as uint256, a lock duration as uint256, and a bool for maxLockEnabled). Use a deposit of 1000 units and a duration of 2,592,000 seconds (30 days). (Note these arguments are passed as numeric types: 1000, 2592000, false.)\nTool: functions.send_transaction_tool  \nArguments:\n contract_address: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"  \n function_name: "createLock"  \n function_args: [ 1000, 2592000, false ]\n• Capture the returned token ID as (for example) “baseline_token_id.” (Assume the first token minted is id = 1.)\n\n────────────────────────────',
    type: "planner-step",
  },
  {
    from: "system",
    text: 'Step 3. Call Voter.reset on the baseline token\n• This will cause the VotingEscrow to reset the token (if its conditions are met) and trigger an accrual of unclaimedFlux.\nTool: functions.send_transaction_tool  \nArguments:\n contract_address: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"  \n function_name: "reset"  \n function_args: [ baseline_token_id ]\n  (Replace baseline_token_id with the actual token id from Step 2, for example 1.)\n\n────────────────────────────',
    type: "planner-step",
  },
  {
    from: "system",
    text: 'Step 4. Read the baseline unclaimedFlux \n• Query FluxToken.unclaimedFlux (a public mapping) for the baseline token id.\nTool: functions.call_view_tool  \nArguments:\n contract_address: "0x0165878A594ca255338adfa4d48449f69242Eb8F"  \n function_name: "unclaimedFlux"  \n function_args: [ baseline_token_id ]\n• Record this value as baselineFlux.\n\n────────────────────────────',
    type: "planner-step",
  },
  {
    from: "system",
    text: 'Step 5. Repeat for 10 iterations (i = 1 to 10)\nFor each iteration, do the following:\n\n a. Create a new “dust” lock on VotingEscrow.  \n  – Call VotingEscrow.createLock with a very small deposit (1 unit), a duration of 2592000 seconds (30 days) and false for maxLockEnabled.\n  Tool: functions.send_transaction_tool  \n  Arguments:\n   contract_address: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"  \n   function_name: "createLock"  \n   function_args: [ 1, 2592000, false ]\n  – Capture the returned token id as new_token_id.\n\n b. Merge the previous token into the new one.\n  – Call VotingEscrow.merge with two arguments: the previous token id (starting with baseline_token_id for iteration 1) and new_token_id.\n  Tool: functions.send_transaction_tool  \n  Arguments:\n   contract_address: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"  \n   function_name: "merge"  \n   function_args: [ previous_token_id, new_token_id ]\n  Note: VotingEscrow.merge internally calls FluxToken.mergeFlux which moves unclaimedFlux from _from to _to and resets the source.\n  – After the merge call, update previous_token_id = new_token_id.\n\n c. Call Voter.reset on the new token to trigger further accrual.\n  Tool: functions.send_transaction_tool  \n  Arguments:\n   contract_address: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"  \n   function_name: "reset"  \n   function_args: [ new_token_id ]\n\n d. Read the unclaimedFlux for the new token.\n  Tool: functions.call_view_tool  \n  Arguments:\n   contract_address: "0x0165878A594ca255338adfa4d48449f69242Eb8F"  \n   function_name: "unclaimedFlux"  \n   function_args: [ new_token_id ]\n  – Record the returned value for each iteration and verify that it is strictly higher than the value from the previous iteration.\n\nRepeat these steps for all 10 iterations.\n\n────────────────────────────',
    type: "planner-step",
  },
  {
    from: "system",
    text: "Step 6. Verification\n• After the loop, compare the final unclaimedFlux value (from the last token) against the baselineFlux. For example, assert that final_flux ≥ (baselineFlux × 10) to support linear accumulation.\n• Document all unclaimedFlux values observed per iteration to conclude if the accumulation is monotonically increasing and roughly linear in the number of iterations.\n\n────────────────────────────",
    type: "planner-step",
  },
  {
    from: "system",
    text: "Step 7. Report Observations\n• Collect the recorded unclaimedFlux values from each iteration.\n• Verify that the final unclaimedFlux is at least ten times the baseline unclaimedFlux.\n\n────────────────────────────\nNotes:\n– This plan assumes that upon calling createLock, the token IDs are issued sequentially (e.g. baseline = 1, then 2, 3, …). You will need to capture these token IDs from the transaction results or from event logs.\n– The VotingEscrow.merge function (see chunk “VotingEscrow.merge”) checks that neither token is in cooldown and that both locks are still active. It then calls FluxToken.mergeFlux (see “FluxToken.mergeFlux”) which adds the source token’s unclaimedFlux into the destination and resets the source’s flux.\n– The Voter.reset call is expected to trigger accrual of unclaimedFlux based on the lock’s current state.\n– Make sure to use our agent’s private key and our address (0x4C1f023A2A914d109bEa600aB518f3078466e279) to send these transactions.\n\nFollowing these steps should generate observable evidence on-chain that repeating this process increases unclaimedFlux roughly linearly with each merge-reset iteration, thereby proving (or disproving) the hypothesis.\n\nPlease proceed with executing these transactions in sequence as planned.",
    type: "planner-step",
  },
  {
    from: "system",
    text: "Calling tool call_view_tool",
    type: "executor-tool-call",
  },
  {
    from: "system",
    text: "call_view_tool: failed - None",
    type: "executor-tool-result",
  },
  {
    from: "system",
    text: "Starting reflection phase to analyze results... Analyzing execution results and planning next steps...",
    type: "description",
  },
  {
    from: "system",
    text: "Reflection completed!",
    type: "description",
  },
  {
    from: "system",
    text: 'reflector agent:\nThe most recent call to the view function "unclaimedFlux" for tokenId 1 failed with “Could not transact with/call contract function, is contract deployed correctly and chain synced?”. This suggests one of the following potential issues:\n\n• The deployed FluxToken (at 0x0165878A594ca255338adfa4d48449f69242Eb8F) might not be available or fully synced on the current chain.\n• The tokenId (assumed to be 1 from our createLock call) may not be recognized if the event logs were not properly captured or the token wasn’t minted.\n• There might be an issue with chain connectivity or network state.\n\nTo address this, I propose the following:\n1. Verify that the FluxToken contract is properly deployed and the address is correct.\n2. Confirm that the transaction for createLock (from step 2) indeed minted tokenId 1 by checking the emitted Transfer events or using a blockchain explorer.\n3. If using a test network or a simulation, ensure that the chain is fully synchronized before calling the view function.\n4. As a debugging step, try calling another public view function on FluxToken (for example, “totalSupply”) to see if calls succeed, which can help isolate if the problem is specific to “unclaimedFlux”.\n\nOnce the deployment and chain sync issues are resolved, reattempt step 4 (and subsequent iterations). Only after successful retrieval of baseline unclaimedFlux and the results from each merge-reset iteration can we verify if unclaimedFlux is increasing roughly linearly as hypothesized.\n\nThus, until the view call succeeds, the audit is incomplete because we cannot confirm the growth of unclaimedFlux and the intended behavior of VotingEscrow.merge and FluxToken.mergeFlux.\n\n',
    type: "agent",
  },
  {
    from: "system",
    text: "Starting vulnerability analysis planning...",
    type: "description",
  },
  {
    from: "system",
    text: "Processing 2 contract/chunk pairs\n• Estimated token usage: 938 tokens (0.5%)",
    type: "description",
  },
  {
    from: "system",
    text: "Performing feasibility assessment for multiple contracts...",
    type: "description",
  },
  {
    from: "system",
    text: "Feasibility assessment completed!",
    type: "description",
  },
  {
    from: "system",
    text: "Generating comprehensive analysis plan using available tools...",
    type: "description",
  },
  {
    from: "system",
    text: "Analysis plan generated successfully!",
    type: "description",
  },
  {
    from: "system",
    text: "Below is the revised step-by-step plan with modifications to address the view-call failure (tokenID lookup failure). In summary, we will first verify that the FluxToken contract is accessible by a simple view call (for example, checking its totalSupply). Then we reattempt the “unclaimedFlux” lookup for the baseline token. (If it still fails, we may need to check that the baseline token was minted correctly.) Once the baseline value is successfully read, the plan continues with the dust lock creation, merge, and reset iterations.\n\n────────────────────────────",
    type: "planner-step",
  },
  {
    from: "system",
    text: 'Step 1. Approve VotingEscrow Contract to Spend BPT  \n• Call the “approve” function on the MockBPT token (address 0x5FbDB2315678afecb367f032d93F642F64180aa3) so that VotingEscrow (address 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853) may transfer up to 1,000,000 units.  \nTool: functions.send_transaction_tool  \nArguments:\n contract_address: "0x5FbDB2315678afecb367f032d93F642F64180aa3"  \n function_name: "approve"  \n function_args: [ "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853", "1000000" ]\n\n────────────────────────────',
    type: "planner-step",
  },
  {
    from: "system",
    text: 'Step 2. Create the Initial (Baseline) Lock  \n• Call VotingEscrow.createLock with deposit = 1000 units, duration = 2,592,000 seconds (30 days), and false for maxLockEnabled.  \nTool: functions.send_transaction_tool  \nArguments:\n contract_address: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"  \n function_name: "createLock"  \n function_args: [ 1000, 2592000, false ]  \n• Capture the returned token ID as “baseline_token_id.” (Assume the first token minted is ID 1—if not, verify via event logs or a subsequent read.)\n\n────────────────────────────',
    type: "planner-step",
  },
  {
    from: "system",
    text: 'Step 3. Call Voter.reset on the Baseline Token  \n• This resets the token’s state within VotingEscrow and triggers accrual of unclaimedFlux.  \nTool: functions.send_transaction_tool  \nArguments:\n contract_address: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"  \n function_name: "reset"  \n function_args: [ baseline_token_id ]  \n (Note: Replace baseline_token_id with, for example, 1.)\n\n────────────────────────────',
    type: "planner-step",
  },
  {
    from: "system",
    text: 'Step 4. Verify FluxToken Accessibility and Read Baseline unclaimedFlux  \na. First, perform a simple view call on FluxToken (address 0x0165878A594ca255338adfa4d48449f69242Eb8F) to check availability. For instance, call “totalSupply” to ensure the contract is deployed and accessible.  \n Tool: functions.call_view_tool  \n Arguments:\n  contract_address: "0x0165878A594ca255338adfa4d48449f69242Eb8F"  \n  function_name: "totalSupply"  \n  function_args: []  \nb. Then, call the “unclaimedFlux” view with the baseline token ID.  \n Tool: functions.call_view_tool  \n Arguments:\n  contract_address: "0x0165878A594ca255338adfa4d48449f69242Eb8F"  \n  function_name: "unclaimedFlux"  \n  function_args: [ baseline_token_id ]  \n• Record the returned baseline value as “baselineFlux.”  \n Note: If the unclaimedFlux call still fails, verify that the baseline token was minted correctly by checking event logs (or using another view function like ownerOf from VotingEscrow).\n\n────────────────────────────',
    type: "planner-step",
  },
  {
    from: "system",
    text: 'Step 5. Loop for 10 Iterations to Accumulate Flux  \nFor iteration i = 1 to 10, perform the following sub-steps:\n\n a. Create a New “Dust” Lock  \n  – Call VotingEscrow.createLock with a very small deposit of 1 unit, duration = 2592000 (30 days), and false for maxLockEnabled.  \n  Tool: functions.send_transaction_tool  \n  Arguments:\n   contract_address: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"  \n   function_name: "createLock"  \n   function_args: [ 1, 2592000, false ]  \n  – Capture the returned token id as new_token_id.\n\n b. Merge the Previous Token into the New Token  \n  – Call VotingEscrow.merge with arguments [ previous_token_id, new_token_id ].  \n  Tool: functions.send_transaction_tool  \n  Arguments:\n   contract_address: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"  \n   function_name: "merge"  \n   function_args: [ previous_token_id, new_token_id ]  \n  – This triggers FluxToken.mergeFlux to transfer unclaimedFlux from the source token (previous_token_id) to new_token_id.\n  – Update previous_token_id = new_token_id.\n\n c. Call Voter.reset on the New Token  \n  Tool: functions.send_transaction_tool  \n  Arguments:\n   contract_address: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"  \n   function_name: "reset"  \n   function_args: [ new_token_id ]\n\n d. Query the unclaimedFlux for the New Token  \n  Tool: functions.call_view_tool  \n  Arguments:\n   contract_address: "0x0165878A594ca255338adfa4d48449f69242Eb8F"  \n   function_name: "unclaimedFlux"  \n   function_args: [ new_token_id ]  \n  – Record this value for comparison with the previous iteration’s flux.\n\n────────────────────────────',
    type: "planner-step",
  },
  {
    from: "system",
    text: "Step 6. Final Verification  \n• After 10 iterations, compare the final unclaimedFlux (from the latest token) with baselineFlux.  \n• For example, assert that:  \n final_flux ≥ baselineFlux × 10  \n• Also, document the unclaimedFlux values from each iteration to verify a monotonic increase as expected.\n\n────────────────────────────",
    type: "planner-step",
  },
  {
    from: "system",
    text: "Step 7. Report Observations  \n• Collate all observed unclaimedFlux values, and verify that the final value increases roughly linearly with the number of iterations.  \n• This evidence would support the hypothesis that repeated “dust” merges and resets can grow unclaimedFlux without bound.\n\n────────────────────────────\nNote:  \n– Ensure the agent uses our private key (0x39229466c90b9c236bd4ec08370c8ec872348767dccfeeb2a6480438cda8a79f) and agent address (0x4C1f023A2A914d109bEa600aB518f3078466e279) when sending transactions.  \n– If any view calls continue to fail, further troubleshooting steps may include verifying contract deployment and examining event logs (e.g., checking VotingEscrow.ownerOf(tokenID)).\n\nPlease proceed with these adjusted steps in sequence.",
    type: "planner-step",
  },
  {
    from: "system",
    text: "Calling tool call_view_tool",
    type: "executor-tool-call",
  },
  {
    from: "system",
    text: "Calling tool call_view_tool",
    type: "executor-tool-call",
  },
  {
    from: "system",
    text: "call_view_tool: failed - None",
    type: "executor-tool-result",
  },
  {
    from: "system",
    text: "Starting reflection phase to analyze results... Analyzing execution results and planning next steps...",
    type: "description",
  },
  {
    from: "system",
    text: "Reflection completed!",
    type: "description",
  },
  {
    from: "system",
    text: 'reflector agent:\nThe latest view calls to FluxToken (both totalSupply and unclaimedFlux for token 1) failed with the error "Could not transact with/call contract function, is contract deployed correctly and chain synced?" This indicates that our test environment is not letting us successfully read from the FluxToken contract—either because the chain is not fully synchronized, the contract at address 0x0165878A594ca255338adfa4d48449f69242Eb8F is not deployed as expected, or there is some network connectivity issue.\n\nBecause the view functions are crucial to observing the unclaimedFlux values (which are needed to confirm the vulnerability hypothesis), we have not yet accumulated on-chain evidence that the unclaimedFlux increases roughly linearly with the repeated merge & reset procedure.\n\nTo fix this, we should:\n1. Verify that the FluxToken contract is indeed deployed at the provided address and that the chain (or test network) is fully synced.\n2. Test basic view functions on the FluxToken contract (e.g. using an external blockchain explorer or a direct node call) to ensure that it returns correct values.\n3. If the contract is deployed through a separate process (or if two address sets are available), use the correct/deployed instance as noted by the deployment structure.\n4. Confirm with event logs if the baseline token (e.g. tokenId 1) was minted correctly, possibly by reading VotingEscrow.ownerOf(1).\n\nDue to these issues with retrieving unclaimedFlux, we cannot yet verify whether repeated merging produces the expected linear growth in the unclaimedFlux accumulation. Until the environment issue is resolved and we can successfully query unclaimedFlux for each token (baseline and post-merge tokens), the audit remains incomplete relative to the required testing scenario.\n\nNo FINAL ANSWER is provided until all tool calls and steps have run successfully.',
    type: "agent",
  },
  {
    from: "system",
    text: "Starting report generation phase... Generating comprehensive vulnerability report...",
    type: "description",
  },
  {
    from: "system",
    text: "Report generation completed!",
    type: "description",
  },
  {
    from: "system",
    text: "reporter agent:\nHere's a summary of potential issues and recommendations for enhancing the smart contract:\n\n| Problems Found                         | Location/Line Snippet                                          | Mitigation/Improvement Suggestions                              |\n|----------------------------------------|----------------------------------------------------------------|-----------------------------------------------------------------|\n| **Repeated growth in `unclaimedFlux`:** Exploiting the smart contract to accumulate unclaimedFlux without bound through repeated dust merges and resets. | VotingEscrow.sol, in the merge function; flux is increased in the mergeFlux function. Unable to validate due to view call failure, but the problem was theoretically identified. | Implement checks in the merge/mergeFlux functions to prevent unbounded accumulation of unclaimedFlux without meaningful progress, such as through cooldown periods or rate limits.                                       |\n| **Call failures due to deployment: Unable to call view functions or interact with the FluxToken's unclaimedFlux and other functionalities due to deployment/sync issues.** | Contract address: 0x0165878A594ca255338adfa4d48449f69242Eb8F; function call failures for unclaimedFlux and totalSupply. | Ensure correct deployment of contracts and verify they are accessible. Validate chain synchronization or consider forcing attempts at reconnection if in a testing environment. Consider utilizing backup mechanisms or more robust logging to verify internal functions are callable and to handle off-chain discrepancies better. |\n\nIssue diagnostic and resolution are advised for smart contract testing environments to ensure reliability in determining potential vulnerabilities before deployment.",
    type: "agent",
  },
  {
    from: "system",
    text: "Run another MAS? (y/N):",
    type: "prompt",
  },
  {
    from: "user",
    text: "N",
  },
  {
    from: "system",
    text: "Session has ended successfully.",
    type: "description",
  },
  {
    from: "system",
    text: "👋  Exiting MAS loop.",
    type: "description",
  },
  {
    from: "system",
    text: "Ending Run.",
    type: "description",
  },
];

//TODO: Implement this new format of option selection
export const mockResultsHypothesis = [
  {
    type: "receive",
    time: 1763315279.220998,
    opcode: 1,
    data: '{"type":"prompt","data":{"prompt":"{\\"prompt\\": \\"Select the contracts and functions you want to test:\\", \\"multiline\\": false, \\"options\\": {\\"deployed\\": [{\\"contract_name\\": \\"Lender\\", \\"chunks\\": [{\\"chunk_name\\": \\"PoolCreated\\", \\"chunk_type\\": \\"event_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"PoolUpdated\\", \\"chunk_type\\": \\"event_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"PoolBalanceUpdated\\", \\"chunk_type\\": \\"event_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"PoolInterestRateUpdated\\", \\"chunk_type\\": \\"event_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"PoolMaxLoanRatioUpdated\\", \\"chunk_type\\": \\"event_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"Borrowed\\", \\"chunk_type\\": \\"event_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"Repaid\\", \\"chunk_type\\": \\"event_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"AuctionStart\\", \\"chunk_type\\": \\"event_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"LoanBought\\", \\"chunk_type\\": \\"event_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"LoanSiezed\\", \\"chunk_type\\": \\"event_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"Refinanced\\", \\"chunk_type\\": \\"event_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"MAX_INTEREST_RATE\\", \\"chunk_type\\": \\"state_variable_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"MAX_AUCTION_LENGTH\\", \\"chunk_type\\": \\"state_variable_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"lenderFee\\", \\"chunk_type\\": \\"state_variable_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"borrowerFee\\", \\"chunk_type\\": \\"state_variable_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"feeReceiver\\", \\"chunk_type\\": \\"state_variable_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"pools\\", \\"chunk_type\\": \\"state_variable_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"loans\\", \\"chunk_type\\": \\"state_variable_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"unnamed_constructor_definition\\", \\"chunk_type\\": \\"constructor_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"setLenderFee\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"setBorrowerFee\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"setFeeReceiver\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"getPoolId\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"getLoanDebt\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"setPool\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"addToPool\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"removeFromPool\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"updateMaxLoanRatio\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"updateInterestRate\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"borrow\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"repay\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"giveLoan\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"startAuction\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"buyLoan\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"zapBuyLoan\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"seizeLoan\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"refinance\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"_calculateInterest\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"_updatePoolBalance\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}]}, {\\"contract_name\\": \\"FeeDistribution\\", \\"chunks\\": [{\\"chunk_name\\": \\"claim\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}]}, {\\"contract_name\\": \\"Staking\\", \\"chunks\\": [{\\"chunk_name\\": \\"balance\\", \\"chunk_type\\": \\"state_variable_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"index\\", \\"chunk_type\\": \\"state_variable_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"supplyIndex\\", \\"chunk_type\\": \\"state_variable_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"balances\\", \\"chunk_type\\": \\"state_variable_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"claimable\\", \\"chunk_type\\": \\"state_variable_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"TKN\\", \\"chunk_type\\": \\"state_variable_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"WETH\\", \\"chunk_type\\": \\"state_variable_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"unnamed_constructor_definition\\", \\"chunk_type\\": \\"constructor_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"deposit\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"withdraw\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"claim\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"update\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"updateFor\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}]}, {\\"contract_name\\": \\"Beedle\\", \\"chunks\\": [{\\"chunk_name\\": \\"unnamed_constructor_definition\\", \\"chunk_type\\": \\"constructor_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"_update\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"nonces\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"mint\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}]}, {\\"contract_name\\": \\"WETH\\", \\"chunks\\": []}], \\"undeployed\\": [{\\"contract_name\\": \\"Fees\\", \\"chunks\\": [{\\"chunk_name\\": \\"WETH\\", \\"chunk_type\\": \\"state_variable_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"staking\\", \\"chunk_type\\": \\"state_variable_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"swapRouter\\", \\"chunk_type\\": \\"state_variable_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"unnamed_constructor_definition\\", \\"chunk_type\\": \\"constructor_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"sellProfits\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}]}, {\\"contract_name\\": \\"IERC20\\", \\"chunks\\": [{\\"chunk_name\\": \\"Transfer\\", \\"chunk_type\\": \\"event_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"Approval\\", \\"chunk_type\\": \\"event_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"totalSupply\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"balanceOf\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"transfer\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"allowance\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"approve\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}, {\\"chunk_name\\": \\"transferFrom\\", \\"chunk_type\\": \\"function_definition\\", \\"selected\\": false}]}, {\\"contract_name\\": \\"Structs.sol\\", \\"chunks\\": [{\\"chunk_name\\": \\"Pool\\", \\"chunk_type\\": \\"struct_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"Borrow\\", \\"chunk_type\\": \\"struct_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"Loan\\", \\"chunk_type\\": \\"struct_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"Refinance\\", \\"chunk_type\\": \\"struct_declaration\\", \\"selected\\": false}, {\\"chunk_name\\": \\"Staked\\", \\"chunk_type\\": \\"struct_declaration\\", \\"selected\\": false}]}]}}","multiline":false}}',
  },
];

const s = {
  type: "prompt",
  data: {
    prompt: {
      prompt: "Select the contracts and functions you want to test:",
      choices: [
        {
          label:
            "1. Revert to Snapsot 0 (baseline) and test another hypothesis",
          value: "1",
        },
        { label: "2. Continue from current state", value: "2" },
        { label: "3. Exit", value: "3" },
      ],
    },
  },
};
